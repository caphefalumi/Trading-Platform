import torch

print("="*60)
print("PyTorch CUDA Check")
print("="*60)
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version (built): {torch.version.cuda}")

if torch.cuda.is_available():
    print(f"\n✓ GPU detected: {torch.cuda.get_device_name(0)}")
    print(f"✓ GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
else:
    print("\n⚠️ CUDA not available")
    print("Note: PyTorch 2.9+ with Python 3.13 may only have CPU version currently.")
    print("For CUDA support, you may need to use Python 3.11 or 3.12.")