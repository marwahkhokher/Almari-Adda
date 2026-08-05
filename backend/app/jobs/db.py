"""
Database helper for managing async job queues in Supabase.
Provides functions to insert, fetch pending, update status, and query job results.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.main import supabase

logger = logging.getLogger(__name__)


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
        res = supabase.table("jobs").insert(data).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.error("Failed to create job: %s", e)
    return None


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single job by its UUID."""
    try:
        res = supabase.table("jobs").select("*").eq("id", job_id).execute()
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

        res = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
        return bool(res.data)
    except Exception as e:
        logger.error("Failed to update job %s: %s", job_id, e)
        return False


def get_pending_jobs(limit: int = 5) -> List[Dict[str, Any]]:
    """Fetches the oldest pending jobs to be processed by background workers."""
    try:
        res = (
            supabase.table("jobs")
            .select("*")
            .eq("status", "pending")
            .order("created_at", ascending=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error("Failed to fetch pending jobs: %s", e)
        return []
