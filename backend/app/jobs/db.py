import os
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / '.env', override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

logger = logging.getLogger(__name__)

# Transient network errors worth a quick retry before giving up — e.g. httpx
# reusing a pooled keep-alive connection that Supabase/Cloudflare already
# closed on their end ("Server disconnected"). One retry with a fresh
# request clears the vast majority of these.
# Transient network errors worth a quick retry before giving up — e.g. httpx
# reusing a pooled keep-alive connection that Supabase/Cloudflare already
# closed on their end ("Server disconnected"), or Windows reporting the same
# thing as WinError 10054 ("forcibly closed"). One or two retries with a
# fresh request clears the vast majority of these.
_RETRYABLE_ERROR_SNIPPETS = (
    "server disconnected",
    "connection reset",
    "connection aborted",
    "forcibly closed",  # Windows WinError 10054
    "winerror 10054",
    "remote protocol error",
    "read timeout",
    "connect timeout",
    "broken pipe",
    "reset by peer",
)


def _is_retryable(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(snippet in message for snippet in _RETRYABLE_ERROR_SNIPPETS)


def _with_retry(operation_name: str, fn, *args, retries: int = 2, backoff_seconds: float = 0.5, **kwargs):
    """Runs fn(*args, **kwargs), retrying once on transient connection errors.
    Returns the underlying supabase response, or raises the last exception if
    every attempt fails / the error isn't one we consider transient."""
    last_exc: Optional[Exception] = None
    for attempt in range(retries + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            last_exc = e
            if attempt < retries and _is_retryable(e):
                logger.warning(
                    "%s: transient error on attempt %d/%d (%s) — retrying",
                    operation_name, attempt + 1, retries + 1, e,
                )
                time.sleep(backoff_seconds)
                continue
            raise
    raise last_exc  # pragma: no cover — unreachable, keeps type checkers happy


def create_job(job_type: str, payload: Dict[str, Any], session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Inserts a new pending job record into Supabase."""
    try:
        data = {
            "job_type": job_type,
            "status": "pending",
            "payload": payload,
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        res = _with_retry(
            "create_job",
            lambda: supabase.table("jobs").insert(data).execute(),
        )
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.error("Failed to create job: %s", e)
    return None


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single job by its UUID."""
    try:
        res = _with_retry(
            f"get_job({job_id})",
            lambda: supabase.table("jobs").select("*").eq("id", job_id).execute(),
        )
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.error("Failed to fetch job %s: %s", job_id, e)
    return None


def update_job_status(
    job_id: str,
    status: str,
    result: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
) -> bool:
    """Updates job status, result payload, and error message."""
    try:
        update_data: Dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now().isoformat(),
        }
        if result is not None:
            update_data["result"] = result
        if error is not None:
            update_data["error"] = error

        res = _with_retry(
            f"update_job_status({job_id})",
            lambda: supabase.table("jobs").update(update_data).eq("id", job_id).execute(),
        )
        return bool(res.data)
    except Exception as e:
        logger.error("Failed to update job %s: %s", job_id, e)
        return False


def get_pending_jobs(limit: int = 5) -> List[Dict[str, Any]]:
    """Fetches the oldest pending jobs to be processed by background workers."""
    try:
        res = _with_retry(
            "get_pending_jobs",
            lambda: (
                supabase.table("jobs")
                .select("*")
                .eq("status", "pending")
                .order("created_at")
                .limit(limit)
                .execute()
            ),
        )
        return res.data or []
    except Exception as e:
        logger.error("Failed to fetch pending jobs: %s", e)
        return []