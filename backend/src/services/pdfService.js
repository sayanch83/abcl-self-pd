const PDFDocument = require('pdfkit');
const fetch = require('node-fetch');
const { format } = require('./dateUtils');

// Brand colours
const RED    = '#C8102E';
const DARK   = '#1a1a1a';
const GRAY   = '#6B7280';
const LGRAY  = '#F3F4F6';
const WHITE  = '#FFFFFF';
const GREEN  = '#059669';

// Try to fetch an image buffer from a URL (base64 data URL or http URL)
async function fetchImageBuffer(url) {
  try {
    if (!url) return null;
    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1];
      return Buffer.from(base64, 'base64');
    }
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) return null;
    return await res.buffer();
  } catch {
    return null;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return iso; }
}

function val(v) { return v || '—'; }
function money(v) { return v ? `Rs. ${Number(v).toLocaleString('en-IN')}` : '—'; }
function cap(v) { return v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'; }

async function generatePdReport(application, submission, geoAnalysis) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: {
        Title: `Self-PD Report — ${application.app_id}`,
        Author: 'Aditya Birla Capital Ltd.',
        Subject: 'Personal Discussion Report',
      }});

      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595.28;   // A4 width pts
      const M = 36;       // margin
      const CW = W - M * 2; // content width

      // ── Helper: draw a horizontal rule ───────────────────────────────────
      const rule = (y, color = '#E5E7EB') => {
        doc.save().moveTo(M, y).lineTo(W - M, y).strokeColor(color).lineWidth(0.5).stroke().restore();
      };

      // ── Helper: section header ────────────────────────────────────────────
      const sectionHeader = (title, y) => {
        doc.rect(M, y, CW, 20).fill(RED);
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), M + 8, y + 6);
        return y + 28;
      };

      // ── Helper: key-value row ─────────────────────────────────────────────
      const row = (label, value, y, indent = 0) => {
        doc.fillColor(RED).font('Helvetica').fontSize(8).text(label, M + indent, y, { width: 160 });
        doc.fillColor(DARK).font('Helvetica').fontSize(8).text(String(value || '—'), M + 170 + indent, y, { width: CW - 170 - indent });
        const h = Math.max(
          doc.heightOfString(String(label), { width: 160 }),
          doc.heightOfString(String(value || '—'), { width: CW - 170 - indent })
        );
        return y + h + 5;
      };

      // ── PAGE 1 ────────────────────────────────────────────────────────────

      // Red header
      doc.rect(0, 0, W, 70).fill(RED);

      // Logo text (since we can't embed the PNG easily in pdfkit without path)
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
         .text('ADITYA BIRLA', M, 18);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
         .text('CAPITAL', M, 32);
      doc.fillColor('rgba(255,255,255,0.7)').font('Helvetica').fontSize(7)
         .text('Self Personal Discussion — Verification Report', M, 54);

      // Right side of header
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
         .text(application.app_id, W - M - 120, 22, { width: 120, align: 'right' });
      doc.fillColor('rgba(255,255,255,0.8)').font('Helvetica').fontSize(7)
         .text(`Generated: ${formatDate(new Date().toISOString())}`, W - M - 120, 38, { width: 120, align: 'right' });
      doc.fillColor('rgba(255,255,255,0.7)').font('Helvetica').fontSize(7)
         .text('CONFIDENTIAL', W - M - 120, 52, { width: 120, align: 'right' });

      let y = 85;

      // ── Application Summary strip ─────────────────────────────────────────
      doc.rect(M, y, CW, 38).fill(LGRAY).stroke('#E5E7EB');
      const summCols = [
        ['Customer', application.customer_name],
        ['Product', application.product],
        ['Amount', money(application.loan_amount)],
        ['Branch', application.branch],
        ['Emp. Type', cap(application.employment_type)],
        ['PD Status', cap(application.status)],
      ];
      const colW = CW / summCols.length;
      summCols.forEach(([label, value], i) => {
        const cx = M + i * colW + 6;
        doc.fillColor(GRAY).font('Helvetica').fontSize(6.5).text(label, cx, y + 6, { width: colW - 8 });
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8).text(value, cx, y + 17, { width: colW - 8 });
      });
      y += 50;

      // ── Section 1: Applicant Details ──────────────────────────────────────
      y = sectionHeader('1. Applicant Details', y);
      y = row('Application ID', application.app_id, y);
      y = row('Customer Name', application.customer_name, y);
      y = row('Bank / NBFC', 'Aditya Birla Capital Ltd.', y);
      y = row('Product', application.product, y);
      y = row('Loan Amount', money(application.loan_amount), y);
      y = row('Branch', application.branch, y);
      y = row('Location', application.location, y);
      y = row('Employment Type', cap(application.employment_type), y);
      y = row('Residence Address', application.residence_address, y);
      y = row(application.employment_type === 'salaried' ? 'Office Address' : 'Business Address', application.office_address, y);
      y += 8;

      // ── Section 2: Residence Details ─────────────────────────────────────
      y = sectionHeader('2. Residence Details', y);
      y = row('Type of Residence', cap(submission?.residence_type), y);
      y = row('Ownership Status', cap(submission?.residence_ownership), y);
      y = row('Years at Address', cap(submission?.years_at_residence), y);
      y = row('Locality Type', cap(submission?.locality_type), y);
      y += 8;

      // ── Section 3: Employment / Business ─────────────────────────────────
      const empTitle = application.employment_type === 'salaried' ? '3. Employment Details' : '3. Business Details';
      y = sectionHeader(empTitle, y);
      if (application.employment_type === 'salaried') {
        y = row('Employer Name', submission?.employer_name, y);
        y = row('Designation', submission?.designation, y);
        y = row('Years Employed', cap(submission?.years_employed), y);
        y = row('Monthly Income', money(submission?.monthly_income), y);
      } else {
        y = row('Business Name', submission?.business_name, y);
        y = row('Business Type', cap(submission?.business_type), y);
        y = row('Years in Business', cap(submission?.years_in_business), y);
        y = row('Monthly Turnover', money(submission?.monthly_turnover), y);
      }
      y += 8;

      // ── Section 4: Personal Details ───────────────────────────────────────
      y = sectionHeader('4. Personal Details', y);
      y = row('Family Members', submission?.family_members, y);
      y = row('Dependents', submission?.dependents, y);
      y = row('Existing Loans', cap(submission?.existing_loans), y);
      y = row('Loan Purpose', submission?.loan_purpose, y);
      if (submission?.additional_notes) {
        y = row('Customer Remarks', submission.additional_notes, y);
      }
      y += 8;

      // ── Section 5: PD Decision ────────────────────────────────────────────
      y = sectionHeader('5. PD Decision', y);
      if (submission?.pd_outcome) {
        const outcomeColor = submission.pd_outcome === 'positive' ? GREEN : RED;
        doc.fillColor(outcomeColor).font('Helvetica-Bold').fontSize(10)
           .text(submission.pd_outcome === 'positive' ? '✓  POSITIVE' : '✗  NEGATIVE', M, y);
        y += 16;
        if (submission.outcome_remarks) {
          y = row('Remarks', submission.outcome_remarks, y);
        }
        if (submission.reviewed_at) {
          y = row('Reviewed On', formatDate(submission.reviewed_at), y);
        }
      } else {
        doc.fillColor(GRAY).font('Helvetica').fontSize(8).text('Decision not yet recorded.', M, y);
        y += 14;
      }
      y += 8;

      // ── PAGE 2: Photos ────────────────────────────────────────────────────
      // Filter to photos only (exclude video entries)
      const photoEntries = (submission?.photos || []).filter(p => p.mediaType !== 'video');

      if (photoEntries.length > 0) {
        doc.addPage({ size: 'A4', margin: 0 });

        // Red header - page 2
        doc.rect(0, 0, W, 40).fill(RED);
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Uploaded Photographs & Geo-tag Verification', M, 13);
        doc.fillColor('rgba(255,255,255,0.75)').font('Helvetica').fontSize(7).text(application.app_id, W - M - 80, 18, { width: 80, align: 'right' });

        const TYPE_LABELS = {
          residence: 'Residence', residence_building: 'Residence — Building',
          residence_door: 'Residence — Entrance Door', office: 'Office',
          business: 'Business', business_outside: 'Business — Outside',
          business_inside: 'Business — Inside',
        };

        let py = 56;
        const imgW   = (CW - 12) / 2;   // 2 columns
        const imgH   = 160;              // photo height
        const capH   = 72;              // caption area height
        const rowH   = imgH + capH + 12; // total row height with gap

        // Pre-fetch all image buffers
        const photosWithBuffers = await Promise.all(
          photoEntries.map(async (photo) => ({
            ...photo,
            buffer: await fetchImageBuffer(photo.url),
          }))
        );

        for (let i = 0; i < photosWithBuffers.length; i += 2) {
          const rowPhotos = photosWithBuffers.slice(i, i + 2);

          // New page if needed
          if (py + rowH > 800) {
            doc.addPage({ size: 'A4', margin: 0 });
            doc.rect(0, 0, W, 40).fill(RED);
            doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Photographs (continued)', M, 13);
            py = 56;
          }

          rowPhotos.forEach((photo, j) => {
            const px = M + j * (imgW + 12);

            // ── Image area — clipped rect so nothing bleeds into caption ──
            doc.save();
            doc.rect(px, py, imgW, imgH).clip();
            doc.rect(px, py, imgW, imgH).fill('#F9FAFB');

            if (photo.buffer) {
              try {
                // Use 'fit' to scale within bounds without overflow
                doc.image(photo.buffer, px, py, { fit: [imgW, imgH], align: 'center', valign: 'center' });
              } catch {
                doc.fillColor(GRAY).font('Helvetica').fontSize(8)
                   .text('Image unavailable', px + imgW / 2 - 30, py + imgH / 2 - 5);
              }
            } else {
              doc.fillColor(GRAY).font('Helvetica').fontSize(8)
                 .text('Image unavailable', px + imgW / 2 - 30, py + imgH / 2 - 5);
            }
            doc.restore();

            // ── Border around image ──
            doc.rect(px, py, imgW, imgH).stroke('#E5E7EB');

            // ── Caption block — strictly below image ──
            const capY = py + imgH;
            doc.rect(px, capY, imgW, capH).fill(LGRAY).stroke('#E5E7EB');

            let ty = capY + 5;

            // Photo type label
            doc.fillColor(RED).font('Helvetica-Bold').fontSize(8)
               .text(TYPE_LABELS[photo.type] || cap(photo.type), px + 6, ty, { width: imgW - 12 });
            ty += 13;

            // Timestamp
            if (photo.timestamp) {
              doc.fillColor(GRAY).font('Helvetica').fontSize(7)
                 .text(`Captured: ${formatDate(photo.timestamp)}`, px + 6, ty, { width: imgW - 12 });
              ty += 11;
            }

            // GPS
            if (photo.lat && photo.lng) {
              doc.fillColor(DARK).font('Helvetica').fontSize(7)
                 .text(`GPS: ${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}`, px + 6, ty, { width: imgW - 12 });
              ty += 11;

              // Distance
              const geo = geoAnalysis?.find(g => g.photoType === photo.type);
              if (geo) {
                const distColor = geo.riskLevel === 'low' ? GREEN : geo.riskLevel === 'medium' ? '#D97706' : RED;
                doc.fillColor(distColor).font('Helvetica-Bold').fontSize(7)
                   .text(`${geo.distanceLabel} — ${geo.distanceKm} km from address`, px + 6, ty, { width: imgW - 12 });
                ty += 11;
              }

              // Street View URL — shortened
              doc.fillColor('#2563EB').font('Helvetica').fontSize(6.5)
                 .text(`maps.google.com/@?api=1&map_action=pano&viewpoint=${photo.lat.toFixed(4)},${photo.lng.toFixed(4)}`, px + 6, ty, { width: imgW - 12 });
            } else {
              doc.fillColor(GRAY).font('Helvetica').fontSize(7)
                 .text('Location not captured', px + 6, ty, { width: imgW - 12 });
            }
          });

          py += rowH;
        }
      }

      // ── Footer on every page ──────────────────────────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        doc.rect(0, 820, W, 22).fill('#F3F4F6');
        doc.fillColor(GRAY).font('Helvetica').fontSize(6.5)
           .text('Aditya Birla Capital Ltd. · This report is confidential and intended for authorised personnel only.', M, 825, { width: CW - 60 });
        doc.fillColor(GRAY).font('Helvetica').fontSize(6.5)
           .text(`Page ${i + 1} of ${range.count}`, W - M - 40, 825, { width: 40, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePdReport };
