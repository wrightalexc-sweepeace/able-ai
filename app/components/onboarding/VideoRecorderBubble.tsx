import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import styles from "./VideoRecorderBubble.module.css";
import {
  Video,
  StopCircle,
  UploadCloud,
  AlertTriangle,
  MonitorPlay,
} from "lucide-react";

interface VideoRecorderBubbleProps {
  id?: string;
  name?: string;
  prompt?: string;
  onVideoRecorded?: (file: File) => void;
  disabled?: boolean;
  uploadFallbackLabel?: string;
  onFileUploaded?: (file: File) => void;
  uploadProgress?: number;
}

const VideoRecorderBubble = React.forwardRef<
  HTMLInputElement,
  VideoRecorderBubbleProps
>( // Ref is for the fallback file input
  (
    {
      id,
      name,
      prompt = "Record a short video",
      onVideoRecorded,
      disabled,
      uploadFallbackLabel = "Or upload a video file",
      onFileUploaded,
      uploadProgress,
    },
    ref
  ) => {
    const inputId = id || name || "videoRecorder";
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [countdown, setCountdown] = useState(30);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
      setError(null);
      setVideoBlobUrl(null);
      setRecordedChunks([]);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        mediaRecorderRef.current = new MediaRecorder(mediaStream);
        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(videoBlob);
          setVideoBlobUrl(url);
          if (onVideoRecorded) {
            const videoFile = new File(
              [videoBlob],
              `${inputId || "video"}.webm`,
              { type: "video/webm" }
            );
            onVideoRecorded(videoFile);
          }
          mediaStream.getTracks().forEach((track) => track.stop());
          setStream(null);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);

        setCountdown(30);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);

        timerRef.current = setTimeout(() => {
          stopRecording();
        }, 30000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError(
          "Could not access camera/microphone. Please check permissions."
        );
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (onFileUploaded) {
          onFileUploaded(file);
        } else if (onVideoRecorded) {
          onVideoRecorded(file);
        }
        setVideoBlobUrl(URL.createObjectURL(file));
        setError(null);
      }
    };

    const toggleVideoRecord = () => {
      setIsVisible(!isVisible);
    };

    useEffect(() => {
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (videoBlobUrl) {
          URL.revokeObjectURL(videoBlobUrl);
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }, [stream, videoBlobUrl]);

    return (
      <div
        className={`${styles.videoBubbleWrapper} ${styles.alignUser} ${
          isVisible ? styles.changeLayout : ""
        }`}
      >
        {isVisible ? (
          <div className={styles.videoBubbleContent}>
            {prompt && <p className={styles.label}>{prompt}</p>}

            {error && (
              <div className={styles.errorDisplay}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.videoPreviewContainer}>
              {videoBlobUrl ? (
                <video
                  src={videoBlobUrl}
                  controls
                  className={styles.videoPreview}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className={styles.videoPreview}
                  style={{ display: isRecording || stream ? "block" : "none" }}
                />
              )}
              {!isRecording && !videoBlobUrl && !stream && (
                <div className={styles.noPreview}>
                  <Video size={48} />
                  <p>Preview will appear here</p>
                </div>
              )}
            </div>

            {uploadProgress !== undefined && uploadProgress > 0 && (
              <div className={styles.progressContainer}>
                <p>Upload Progress: {Math.round(uploadProgress)}%</p>
                <div
                  className={styles.progressBar}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className={styles.controls}>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled || !!stream}
                  className={styles.controlButton}
                >
                  <Video size={16} /> Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  disabled={disabled}
                  className={`${styles.controlButton} ${styles.stopButton}`}
                >
                  <StopCircle size={16} /> Stop Recording ({countdown}s)
                </button>
              )}
            </div>

            {onFileUploaded && !isRecording && (
              <div className={styles.uploadFallback}>
                <label
                  htmlFor={`${inputId}-fileUpload`}
                  className={styles.fileInputLabel}
                >
                  <UploadCloud size={16} />
                  <span>{uploadFallbackLabel}</span>
                </label>
                <input
                  type="file"
                  id={`${inputId}-fileUpload`}
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={disabled}
                  className={styles.fileInput}
                  ref={ref}
                />
              </div>
            )}
          </div>
        ) : (
          <MonitorPlay color="#fff" className={styles.monitorPlay} />
        )}
        <button
          type="button"
          onClick={toggleVideoRecord}
          className={`${styles.toggleButton} ${
            isVisible ? styles.makeCenter : ""
          }`}
        >
          {!isVisible ? "RECORD VIDEO" : "CANCEL RECORDING"}
        </button>
      </div>
    );
  }
);

VideoRecorderBubble.displayName = "VideoRecorderBubble";
export default VideoRecorderBubble;
