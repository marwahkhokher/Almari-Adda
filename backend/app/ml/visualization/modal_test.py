import modal

app = modal.App("almari-adda-test")


@app.function()
def hello():
    return "Modal is working!"


@app.function(gpu="T4")
def check_gpu():
    import subprocess
    result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
    return result.stdout


@app.local_entrypoint()
def main():
    print(hello.remote())
    print(check_gpu.remote())