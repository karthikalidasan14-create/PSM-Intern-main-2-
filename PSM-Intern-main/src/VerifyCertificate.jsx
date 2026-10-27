import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PublicAPI } from "./api.js";
import InternPublicProfile from "./InternPublicProfile.jsx";
import { getInternFromFirestore } from "./firebase.js";

export default function VerifyCertificate() {
  const [params] = useSearchParams();
  const queryId = params.get("id") || params.get("certificate_id") || "";
  const [certificateId, setCertificateId] = useState(queryId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);

  async function verify(idToVerify) {
    const value = (idToVerify || certificateId).trim();
    if (!value) return;
    setError("");
    setLoading(true);

    try {
      // 1. First, attempt query via Flask API / local database
      const data = await PublicAPI.verify(value);
      setResult(data);
    } catch (err) {
      // 2. If API returns not found or error, attempt Firestore fallback
      try {
        const firestoreData = await getInternFromFirestore(value);
        if (firestoreData) {
          setResult({
            valid: firestoreData["Certificate status"] === "Valid" || firestoreData["Certificate status"] === "Completed",
            status: firestoreData["Certificate status"] || "Valid",
            certificate_id: firestoreData.certificateId || firestoreData.id,
            intern: {
              intern_id: firestoreData.internId || firestoreData.id,
              full_name: firestoreData.name || firestoreData.Name || "Intern",
              domain: firestoreData.Domain || firestoreData.domain || "",
              organisation: firestoreData.Organisation || firestoreData.organisation || "Problem Solving Mind",
              duration_label: firestoreData.Duration || firestoreData.duration || "",
              start_date: firestoreData.startDate || null,
              end_date: firestoreData.endDate || null,
              photo_url: firestoreData.photoUrl || null,
            },
            project: firestoreData.project || null,
            evaluation: firestoreData.evaluation || null,
            certificate: {
              certificate_id: firestoreData.certificateId || firestoreData.id,
              status: firestoreData["Certificate status"] || "Valid",
              qr_url: `/api/certificates/${firestoreData.certificateId || firestoreData.id}/qr`,
            },
          });
          setLoading(false);
          return;
        }
      } catch (fErr) {
        // Ignore Firestore error and surface original
      }

      setResult(null);
      setError(err.message || `No certificate record found matching '${value}'.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (queryId) {
      setCertificateId(queryId);
      verify(queryId);
    }
  }, [queryId]);

  async function startScan() {
    setScanning(true);
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5Ref.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decoded) => {
          // Detect query param in scanned URL e.g. https://domain/verify?id=PSM001
          const match = decoded.match(/[?&]id=([^&]+)/i);
          const id = match ? decodeURIComponent(match[1]) : decoded.trim();
          setCertificateId(id);
          verify(id);
          stopScan();
        }
      );
    } catch (err) {
      setError("Camera access error: " + (err.message || err));
      setScanning(false);
    }
  }

  async function stopScan() {
    setScanning(false);
    if (html5Ref.current) {
      try {
        await html5Ref.current.stop();
        html5Ref.current.clear();
      } catch (e) {
        // ignore cleanup error
      }
      html5Ref.current = null;
    }
  }

  return (
    <main className="page verification-page">
      {/* VERIFICATION SEARCH BAR */}
      <section className="card verify-search-card">
        <div className="verify-search-intro">
          <p className="eyebrow">PROBLEM SOLVING MIND · CREDENTIAL REGISTRY</p>
          <h1>Official Intern Certificate Verification</h1>
          <p className="muted">
            Scan the QR code printed on the official PSM certificate or ID card, or enter the unique identifier
            below to confirm authenticity and view the complete public professional profile.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            verify();
          }}
          className="verify-form"
        >
          <label htmlFor="certificateId" style={{ marginTop: 0 }}>Certificate ID or Intern ID</label>
          <div className="search-row">
            <input
              id="certificateId"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="e.g. PSM001 or PSM-CERT-PSM001"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Credential"}
            </button>
            {!scanning ? (
              <button type="button" className="secondary" onClick={startScan}>
                📷 Scan QR Code
              </button>
            ) : (
              <button type="button" className="danger" onClick={stopScan}>
                Stop Camera
              </button>
            )}
          </div>
        </form>

        <div id="qr-reader" className="qr-box" ref={scannerRef} />

        {error && (
          <div className="alert error" role="alert" style={{ marginTop: 18 }}>
            <strong>Verification Result: </strong> {error}
          </div>
        )}
      </section>

      {/* VERIFIED PROFESSIONAL PUBLIC PROFILE */}
      {result && (
        <section className="verification-profile-wrapper" style={{ marginTop: 24 }}>
          <InternPublicProfile data={result} certificateId={certificateId} />
        </section>
      )}
    </main>
  );
}
