"use client";

import { Camera, Search, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AppRecord } from "@/lib/types";

type NativeBarcodeDetector = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => NativeBarcodeDetector;

function matchesAsset(asset: AppRecord, query: string) {
  const key = query.trim().toLowerCase();
  if (!key) return true;

  return [
    asset.code,
    asset.title,
    asset.owner,
    asset.status,
    asset.meta.serial,
    asset.meta.model
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(key);
}

export function QrScannerPanel({ records }: { records: AppRecord[] }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState("พร้อมค้นหา Asset Tag");

  const filteredRecords = useMemo(() => records.filter((asset) => matchesAsset(asset, query)).slice(0, 8), [records, query]);

  function stopCamera() {
    if (scanLoopRef.current) {
      window.cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
    setMessage("หยุดกล้องแล้ว");
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Browser นี้ไม่รองรับการเปิดกล้อง");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      setMessage("กำลังเปิดกล้อง");

      const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (!Detector || !videoRef.current) {
        setMessage("เปิดกล้องแล้ว ถ้า browser ไม่อ่าน QR อัตโนมัติให้กรอก Asset Tag ด้านล่าง");
        return;
      }

      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            setQuery(value);
            setMessage(`พบ QR: ${value}`);
          } else {
            setMessage("กำลังสแกน QR");
          }
        } catch {
          setMessage("เปิดกล้องแล้ว ถ้าอ่าน QR ไม่ได้ให้กรอก Asset Tag ด้านล่าง");
        }
        scanLoopRef.current = window.requestAnimationFrame(scan);
      };
      scanLoopRef.current = window.requestAnimationFrame(scan);
    } catch {
      setMessage("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องหรือใช้ช่องค้นหา");
      stopCamera();
    }
  }

  useEffect(() => stopCamera, []);

  return (
    <section className="qr-layout">
      <article className="panel scanner-panel">
        <div className="scanner-frame">
          <video ref={videoRef} muted playsInline aria-label="QR camera preview" />
          {!isScanning ? <span>QR</span> : null}
          <i />
        </div>
        <p className="scanner-status">{message}</p>
        <div className="scanner-actions">
          <button className="button primary" type="button" onClick={startCamera} disabled={isScanning}>
            <Camera size={16} aria-hidden="true" />
            เปิดกล้อง
          </button>
          <button className="button ghost" type="button" onClick={stopCamera} disabled={!isScanning}>
            <Square size={16} aria-hidden="true" />
            หยุด
          </button>
        </div>
        <label className="manual-scan">
          <span>ค้นหา Asset Tag</span>
          <span className="input-with-icon">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น IT-2569-00001" />
          </span>
        </label>
      </article>
      <article className="panel">
        <div className="panel-head">
          <h2>ผลลัพธ์ล่าสุด</h2>
        </div>
        <div className="asset-card-list">
          {filteredRecords.length ? (
            filteredRecords.map((asset) => (
              <div className="asset-mini" key={asset.id}>
                <strong>{asset.code}</strong>
                <span>{asset.title}</span>
                <small>
                  {asset.owner || "-"} · {asset.status || "-"}
                </small>
              </div>
            ))
          ) : (
            <div className="empty-table">
              <strong>ไม่พบ Asset</strong>
              <span>ลองกรอก Asset Tag, Serial หรือชื่ออุปกรณ์อีกครั้ง</span>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
