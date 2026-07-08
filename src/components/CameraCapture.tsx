"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  /** 拍照完成回调，返回 base64 图片数据 */
  onCapture: (base64: string) => void;
  /** 已存在的图片 URL（编辑模式） */
  existingImage?: string | null;
  /** 清除已捕获的图片 */
  onClear?: () => void;
}

export default function CameraCapture({ onCapture, existingImage, onClear }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  /** 打开摄像头 */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("摄像头权限被拒绝，请在浏览器设置中允许摄像头访问");
      } else if (err.name === "NotFoundError") {
        setCameraError("未检测到摄像头设备");
      } else {
        setCameraError("无法打开摄像头：" + err.message);
      }
    }
  }, []);

  /** 拍照 */
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(base64);
    stopCamera();
  }, []);

  /** 关闭摄像头 */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  /** 确认使用照片 */
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  /** 重新拍摄 */
  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  /** 清除 */
  const clearPhoto = useCallback(() => {
    setCapturedImage(null);
    onClear?.();
  }, [onClear]);

  const handleClose = useCallback(() => {
    stopCamera();
    setShowCamera(false);
    setCapturedImage(null);
    setCameraError(null);
  }, [stopCamera]);

  // 已有图片时显示预览
  if (existingImage && !capturedImage) {
    return (
      <div className="relative">
        <img src={existingImage} alt="已上传图片" className="w-full rounded-lg border border-gray-200 max-h-48 object-cover" />
        {onClear && (
          <button onClick={clearPhoto} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 拍照/重拍按钮 */}
      {!showCamera && !capturedImage && (
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-shibu-400 hover:text-shibu-600 transition text-sm w-full justify-center"
        >
          <Camera className="w-4 h-4" /> 拍照录入
        </button>
      )}

      {/* 摄像头预览 */}
      {showCamera && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-72 object-contain" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 bg-gray-700/80 text-white rounded-full hover:bg-gray-600/80"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="p-3 bg-white text-gray-800 rounded-full hover:bg-gray-100 shadow-lg ring-2 ring-white"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 拍照结果预览 */}
      {capturedImage && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img src={capturedImage} alt="拍照结果" className="w-full max-h-72 object-contain bg-gray-50" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4">
            <button
              type="button"
              onClick={retake}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/80 text-white rounded-lg text-sm hover:bg-gray-600/80"
            >
              <RefreshCw className="w-4 h-4" /> 重拍
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Check className="w-4 h-4" /> 使用此照片
            </button>
          </div>
        </div>
      )}

      {/* 摄像头错误提示 */}
      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {cameraError}
        </div>
      )}
    </div>
  );
}
