/**
 * Size Comparison Tool v3.1
 * Standard: https://wohwooh.com/pages/size-guide
 *
 * STANDARD WOMEN'S MEASUREMENTS (INCHES):
 * SIZE        | BUST       | WAIST      | HIPS       | SLEEVE
 * S           | 33" - 35"  | 25" - 27"  | 35" - 37"  | 23.5" - 24"
 * M           | 36" - 37"  | 28" - 29"  | 38" - 39"  | 24.0" - 24.5"
 * L           | 38" - 40"  | 30" - 32"  | 40" - 42"  | 24.5" - 25.0"
 * XL          | 41" - 43"  | 33" - 35"  | 43" - 45"  | 25.0" - 25.5"
 *
 * MATCH LOGIC:
 * - Upload value >= MIN of standard range → MATCH (đủ hoặc thừa)
 * - Upload value <  MIN of standard range → UNMATCH (thiếu)
 */

// ==================================================================
// WOHWOOH US SIZE STANDARD - CHÍNH XÁC 100%
// ==================================================================
const WOHWOOH_STANDARD = {
    // Thứ tự: BUST, WAIST, HIPS, SLEEVE (đúng theo website)
    keys: ["bust", "waist", "hips", "sleeve"],
    labels: {
        bust:   "BUST (Ngực)",
        waist:  "WAIST (Eo)",
        hips:   "HIPS (Mông)",
        sleeve: "SLEEVE (Tay áo)"
    },
    sizes: {
        "S": {
            bust:   { min: 33, max: 35 },
            waist:  { min: 25, max: 27 },
            hips:   { min: 35, max: 37 },
            sleeve: { min: 23.5, max: 24 }
        },
        "M": {
            bust:   { min: 36, max: 37 },
            waist:  { min: 28, max: 29 },
            hips:   { min: 38, max: 39 },
            sleeve: { min: 24, max: 24.5 }
        },
        "L": {
            bust:   { min: 38, max: 40 },
            waist:  { min: 30, max: 32 },
            hips:   { min: 40, max: 42 },
            sleeve: { min: 24.5, max: 25 }
        },
        "XL": {
            bust:   { min: 41, max: 43 },
            waist:  { min: 33, max: 35 },
            hips:   { min: 43, max: 45 },
            sleeve: { min: 25, max: 25.5 }
        }
    }
};

const VALID_SIZES = ["S", "M", "L", "XL"];

// ==================================================================
// GLOBAL
// ==================================================================
let uploadedImages = [];
let tolerance = 2; // cm
let isProcessing = false;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const DOM = {
    tabBtns: $$('.tab-btn'), tabContents: $$('.tab-content'),
    fileInput: $('#file-input'), dropzone: $('#dropzone'),
    urlInputs: $('#url-inputs'), addUrlBtn: $('#add-url-btn'), loadUrlsBtn: $('#load-urls-btn'),
    toleranceInput: $('#tolerance'), toleranceInch: $('#tolerance-inch'),
    enhanceCheckbox: $('#enhance-image'),
    previewSection: $('#preview-section'), previewGrid: $('#preview-grid'),
    imageCount: $('#image-count'), clearAllBtn: $('#clear-all-btn'),
    compareBtn: $('#compare-btn'),
    standardTbody: $('#standard-tbody'),
    resultsCard: $('#results-card'), resultsSummary: $('#results-summary'),
    resultsContainer: $('#results-container'),
    loadingOverlay: $('#loading-overlay'), loadingText: $('#loading-text'),
    loadingDetail: $('#loading-detail'), progress: $('#progress'),
    toastContainer: $('#toast-container')
};

// ==================================================================
// INIT
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadStandardTable();
    initTabs();
    initDropzone();
    initUrlInputs();
    initSettings();
    initButtons();
    showToast('Sẵn sàng! Upload tối đa 5 ảnh bảng size.', 'info');
});

// ==================================================================
// STANDARD TABLE - Hiển thị đúng range MIN - MAX
// ==================================================================
function loadStandardTable() {
    const tbody = DOM.standardTbody;
    tbody.innerHTML = '';

    Object.entries(WOHWOOH_STANDARD.sizes).forEach(([size, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${size}</strong></td>
            <td>${data.bust.min}" - ${data.bust.max}"</td>
            <td>${data.waist.min}" - ${data.waist.max}"</td>
            <td>${data.hips.min}" - ${data.hips.max}"</td>
            <td>${data.sleeve.min}" - ${data.sleeve.max}"</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================================================================
// TABS
// ==================================================================
function initTabs() {
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            DOM.tabContents.forEach(c => {
                c.classList.toggle('active', c.id === `${btn.dataset.tab}-tab`);
            });
        });
    });
}

// ==================================================================
// DROPZONE
// ==================================================================
function initDropzone() {
    const dz = DOM.dropzone;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e =>
        dz.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); })
    );
    ['dragenter', 'dragover'].forEach(e =>
        dz.addEventListener(e, () => dz.classList.add('dragover'))
    );
    ['dragleave', 'drop'].forEach(e =>
        dz.addEventListener(e, () => dz.classList.remove('dragover'))
    );
    dz.addEventListener('drop', e => {
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
    dz.addEventListener('click', e => {
        if (!e.target.closest('.file-label')) DOM.fileInput.click();
    });
    DOM.fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFiles(e.target.files);
        e.target.value = '';
    });
}

async function handleFiles(files) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return showToast('Chọn file ảnh!', 'warning');

    const remain = 5 - uploadedImages.length;
    if (remain <= 0) return showToast('Đã đủ 5 ảnh!', 'warning');

    const toAdd = valid.slice(0, remain);
    if (valid.length > remain) showToast(`Chỉ thêm ${remain} ảnh nữa.`, 'warning');

    const promises = toAdd.map((file, i) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve({
            id: `f_${Date.now()}_${i}`,
            name: file.name,
            src: e.target.result,
            size: file.size
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
    }));

    try {
        const results = await Promise.all(promises);
        results.forEach(img => {
            if (!uploadedImages.some(x => x.name === img.name && x.size === img.size)) {
                uploadedImages.push(img);
            }
        });
        updatePreview();
        showToast(`Thêm ${results.length} ảnh! (${uploadedImages.length}/5)`, 'success');
    } catch (e) {
        showToast('Lỗi đọc file!', 'error');
    }
}

// ==================================================================
// URL INPUTS
// ==================================================================
function initUrlInputs() {
    DOM.addUrlBtn.addEventListener('click', () => {
        if (DOM.urlInputs.children.length >= 5) return showToast('Tối đa 5!', 'warning');
        const g = document.createElement('div');
        g.className = 'url-input-group';
        g.innerHTML = `<input type="text" class="url-input" placeholder="URL ảnh..."><button class="btn-remove-url"><i class="fas fa-times"></i></button>`;
        DOM.urlInputs.appendChild(g);
    });

    DOM.urlInputs.addEventListener('click', e => {
        if (e.target.closest('.btn-remove-url')) {
            const g = e.target.closest('.url-input-group');
            DOM.urlInputs.children.length > 1 ? g.remove() : (g.querySelector('.url-input').value = '');
        }
    });

    DOM.loadUrlsBtn.addEventListener('click', async () => {
        const urls = Array.from(DOM.urlInputs.querySelectorAll('.url-input'))
            .map(i => i.value.trim())
            .filter(u => { try { new URL(u); return true; } catch { return false; } });
        if (!urls.length) return showToast('Nhập URL hợp lệ!', 'warning');

        const remain = 5 - uploadedImages.length;
        if (remain <= 0) return showToast('Đã đủ 5!', 'warning');

        showLoading('Đang tải ảnh...');
        let ok = 0;
        for (let i = 0; i < Math.min(urls.length, remain); i++) {
            try {
                updateLoadingText(`Tải ${i + 1}/${urls.length}...`);
                const src = await fetchImg(urls[i]);
                uploadedImages.push({
                    id: `u_${Date.now()}_${i}`,
                    name: urls[i].split('/').pop() || `Img${i + 1}`,
                    src
                });
                ok++;
            } catch (e) {
                showToast(`Lỗi: ${urls[i].substring(0, 30)}...`, 'error');
            }
        }
        hideLoading();
        updatePreview();
        if (ok) showToast(`Tải ${ok} ảnh! (${uploadedImages.length}/5)`, 'success');
    });
}

function fetchImg(url) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const t = setTimeout(() => rej('Timeout'), 15000);
        img.onload = () => {
            clearTimeout(t);
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            res(c.toDataURL('image/png'));
        };
        img.onerror = () => {
            clearTimeout(t);
            const p = new Image();
            p.crossOrigin = 'Anonymous';
            p.onload = () => {
                const c = document.createElement('canvas');
                c.width = p.width; c.height = p.height;
                c.getContext('2d').drawImage(p, 0, 0);
                res(c.toDataURL('image/png'));
            };
            p.onerror = () => rej('Failed');
            p.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        };
        img.src = url;
    });
}

// ==================================================================
// PREVIEW
// ==================================================================
function updatePreview() {
    DOM.imageCount.textContent = uploadedImages.length;
    DOM.previewGrid.innerHTML = '';

    if (!uploadedImages.length) {
        DOM.previewSection.style.display = 'none';
        DOM.compareBtn.disabled = true;
        DOM.compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> So Sánh Kích Thước';
        return;
    }

    DOM.previewSection.style.display = 'block';
    DOM.previewSection.classList.add('show');
    DOM.compareBtn.disabled = false;
    DOM.compareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> So Sánh ${uploadedImages.length} Ảnh`;

    uploadedImages.forEach((img, i) => {
        const d = document.createElement('div');
        d.className = 'preview-item';
        d.innerHTML = `
            <img src="${img.src}" alt="${img.name}">
            <button class="remove-btn" onclick="removeImage(${i})"><i class="fas fa-times"></i></button>
            <span class="image-index">#${i + 1}</span>
        `;
        DOM.previewGrid.appendChild(d);
    });
}

window.removeImage = i => { uploadedImages.splice(i, 1); updatePreview(); };
window.clearAllImages = () => {
    uploadedImages = [];
    updatePreview();
    DOM.resultsCard.style.display = 'none';
};

// ==================================================================
// SETTINGS & BUTTONS
// ==================================================================
function initSettings() {
    DOM.toleranceInput.addEventListener('input', e => {
        tolerance = parseFloat(e.target.value) || 0;
        DOM.toleranceInch.textContent = (tolerance / 2.54).toFixed(2);
    });
}

function initButtons() {
    DOM.compareBtn.addEventListener('click', runComparison);
    DOM.clearAllBtn?.addEventListener('click', window.clearAllImages);
}

// ==================================================================
// MAIN COMPARISON
// ==================================================================
async function runComparison() {
    if (!uploadedImages.length) return showToast('Upload ít nhất 1 ảnh!', 'error');
    if (isProcessing) return;
    isProcessing = true;
    DOM.compareBtn.disabled = true;

    showLoading('Khởi tạo OCR...');
    DOM.resultsContainer.innerHTML = '';
    DOM.resultsSummary.innerHTML = '';
    DOM.resultsCard.style.display = 'block';

    let matchCount = 0, unmatchCount = 0;
    const total = uploadedImages.length;

    for (let i = 0; i < total; i++) {
        const num = i + 1;
        updateProgress((i / total) * 100);
        updateLoadingText(`Xử lý ảnh ${num}/${total}...`);
        updateLoadingDetail(uploadedImages[i].name);

        try {
            const result = await processImage(uploadedImages[i], num, total);
            result.status === 'match' ? matchCount++ : unmatchCount++;
            displayResult(result, num);
        } catch (e) {
            unmatchCount++;
            displayError(uploadedImages[i], num, e.message);
        }
        updateProgress(((i + 1) / total) * 100);
    }

    displaySummary(total, matchCount, unmatchCount);
    hideLoading();
    isProcessing = false;
    DOM.compareBtn.disabled = false;

    if (matchCount === total) showToast(`✅ Tất cả ${total} ảnh MATCH!`, 'success');
    else if (unmatchCount === total) showToast(`❌ Tất cả ${total} ảnh UNMATCH!`, 'error');
    else showToast(`${matchCount} MATCH, ${unmatchCount} UNMATCH`, 'info');
}

// ==================================================================
// IMAGE PROCESSING
// ==================================================================
async function processImage(imgData, current, total) {
    // Load
    const img = await new Promise((res, rej) => {
        const i = new Image();
        i.crossOrigin = 'Anonymous';
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('Load failed'));
        i.src = imgData.src;
    });

    // Create multiple versions for OCR
    const canvases = [];

    // Version 1: Enhanced (high contrast B&W)
    if (DOM.enhanceCheckbox.checked) {
        updateLoadingDetail('Làm rõ ảnh...');
        canvases.push(enhanceImage(img, 1.6, 130));
        canvases.push(enhanceImage(img, 1.3, 120)); // Softer threshold
    }

    // Version 2: Scaled original (grayscale)
    const scaled = scaleImage(img);
    canvases.push(scaled);

    // OCR on all versions, combine results
    let allText = '';
    for (let c = 0; c < canvases.length; c++) {
        updateLoadingDetail(`OCR scan ${c + 1}/${canvases.length}...`);
        try {
            const text = await ocrScan(canvases[c], current, total);
            allText += text + '\n===NEXT_SCAN===\n';
        } catch (e) {
            console.error('OCR scan failed:', e);
        }
    }

    console.log('=== ALL OCR TEXT ===\n', allText.substring(0, 800));

    // Parse
    updateLoadingDetail('Phân tích...');
    const measurements = parseAllText(allText);
    console.log('Parsed measurements:', JSON.stringify(measurements, null, 2));

    // Compare
    const comparison = compareMeasurements(measurements);

    return {
        image: imgData,
        text: allText,
        measurements,
        comparison,
        status: comparison.overallMatch ? 'match' : 'unmatch'
    };
}

function scaleImage(img) {
    const canvas = document.createElement('canvas');
    const scale = Math.max(2, Math.min(3, 2000 / Math.max(img.width, img.height)));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function enhanceImage(img, contrast, threshold) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = Math.max(2, Math.min(3, 2000 / Math.max(img.width, img.height)));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128));
        const v = g > threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(id, 0, 0);
    return canvas;
}

async function ocrScan(canvas, current, total) {
    const result = await Tesseract.recognize(canvas, 'eng', {
        logger: m => {
            if (m.status === 'recognizing text') {
                updateProgress(((current - 1) / total) * 100 + (m.progress * 30) / total);
            }
        }
    });
    return result.data.text;
}

// ==================================================================
// TEXT PARSING - Tìm tất cả sizes S, M, L, XL
// ==================================================================
function parseAllText(rawText) {
    const results = {};

    // Detect unit
    const lower = rawText.toLowerCase();
    const isCm = lower.includes('cm') || lower.includes('厘米') || lower.includes('centimeter');
    const unit = isCm ? 'cm' : 'inch';
    console.log('Unit:', unit);

    // Clean
    const text = rawText
        .replace(/\|/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/[""]/g, '"')
        .replace(/[']/g, "'")
        .replace(/,/g, '.')
        .replace(/—|-{2,}/g, '-');

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Check if US/UK format - skip UK lines
    const hasUSUK = lower.includes('us/uk') || lower.includes('us / uk') ||
        (lower.includes('us') && lower.includes('uk'));

    // Parse each line
    for (const line of lines) {
        // Skip UK-only lines
        if (hasUSUK) {
            if (/\bUK\b/i.test(line) && !/\bUS\b/i.test(line)) continue;
        }

        // Find size in line
        for (const size of VALID_SIZES) {
            // Match size but avoid matching S in words like "STANDARD", "SLEEVE", "SIZE", "SMALL"
            // Match standalone S, M, L, XL
            const sizePatterns = [
                new RegExp(`\\b${size}\\b(?!\\w)`, 'i'),
                new RegExp(`^${size}\\s`, 'i'),
                new RegExp(`\\s${size}\\s`, 'i'),
                new RegExp(`\\(${size}\\)`, 'i')
            ];

            // For "S", be more careful
            let found = false;
            if (size === 'S') {
                // Only match standalone S, not S in words
                found = /(?:^|\s|[|(])S(?:\s|$|[|)])/i.test(line) ||
                    /\bSmall\b/i.test(line) ||
                    /\bS\b\s*\d/i.test(line);
            } else if (size === 'M') {
                found = /(?:^|\s|[|(])M(?:\s|$|[|)])/i.test(line) ||
                    /\bMedium\b/i.test(line) ||
                    /\bM\b\s*\d/i.test(line);
            } else if (size === 'L') {
                found = /(?:^|\s|[|(])L(?:\s|$|[|)])/i.test(line) ||
                    /\bLarge\b/i.test(line) ||
                    /\bL\b\s*\d/i.test(line);
            } else if (size === 'XL') {
                found = /\bXL\b/i.test(line) || /\bX-Large\b/i.test(line);
            }

            if (!found) continue;

            // Extract numbers from this line
            const nums = extractNumbers(line);
            if (nums.length < 2) continue;

            // Only update if we got more numbers than before
            if (results[size] && results[size]._count >= nums.length) continue;

            results[size] = {
                rawNumbers: nums,
                _count: nums.length,
                unit
            };
            console.log(`Line found ${size}: [${nums.join(', ')}] from: "${line.substring(0, 60)}"`);
        }
    }

    // Fallback: pattern matching on full text
    for (const size of VALID_SIZES) {
        if (results[size] && results[size]._count >= 3) continue;

        const fullText = text.replace(/\n/g, ' ');
        let pattern;

        if (size === 'XL') {
            pattern = /\bXL\b[^A-Za-z]*?(\d+\.?\d*)[^\d]+(\d+\.?\d*)(?:[^\d]+(\d+\.?\d*))?(?:[^\d]+(\d+\.?\d*))?/gi;
        } else {
            pattern = new RegExp(
                `(?:^|\\s|[(|])${size}(?:\\s|$|[)|])` +
                `[^A-Za-z]*?(\\d+\\.?\\d*)[^\\d]+(\\d+\\.?\\d*)(?:[^\\d]+(\\d+\\.?\\d*))?(?:[^\\d]+(\\d+\\.?\\d*))?`,
                'gi'
            );
        }

        let match;
        while ((match = pattern.exec(fullText)) !== null) {
            const nums = [match[1], match[2], match[3], match[4]]
                .filter(n => n !== undefined)
                .map(n => parseFloat(n))
                .filter(n => !isNaN(n) && n >= 5 && n <= 90);

            if (nums.length >= 2) {
                if (!results[size] || nums.length > results[size]._count) {
                    results[size] = { rawNumbers: nums, _count: nums.length, unit };
                    console.log(`Pattern found ${size}: [${nums.join(', ')}]`);
                }
            }
        }
    }

    // Map raw numbers to measurements (bust, waist, hips, sleeve)
    Object.keys(results).forEach(size => {
        const data = results[size];
        const nums = data.rawNumbers;
        const toInch = v => data.unit === 'cm' ? round2(v / 2.54) : v;

        const mapped = { unit: data.unit, rawNumbers: nums };

        // Map based on number count
        // Standard order: bust, waist, hips, sleeve
        if (nums.length >= 4) {
            mapped.bust = toInch(nums[0]);
            mapped.waist = toInch(nums[1]);
            mapped.hips = toInch(nums[2]);
            mapped.sleeve = toInch(nums[3]);
        } else if (nums.length === 3) {
            mapped.bust = toInch(nums[0]);
            mapped.waist = toInch(nums[1]);
            mapped.hips = toInch(nums[2]);
        } else if (nums.length === 2) {
            mapped.bust = toInch(nums[0]);
            mapped.waist = toInch(nums[1]);
        }

        results[size] = mapped;
    });

    return results;
}

function extractNumbers(line) {
    const nums = [];
    // Match numbers like 33, 35.5, 23.5
    const pattern = /(\d+\.?\d*)/g;
    let m;
    while ((m = pattern.exec(line)) !== null) {
        const v = parseFloat(m[1]);
        if (v >= 5 && v <= 90) {
            nums.push(v);
        }
    }
    return nums;
}

function round2(n) { return Math.round(n * 100) / 100; }

// ==================================================================
// COMPARISON
// Upload >= MIN of standard → MATCH
// Upload <  MIN of standard → UNMATCH
// ==================================================================
function compareMeasurements(extracted) {
    const tolInch = tolerance / 2.54;

    const result = {
        overallMatch: true,
        details: [],
        matchedSizes: [],
        unmatchedSizes: [],
        totalChecked: 0,
        totalMatched: 0,
        noData: false
    };

    if (!Object.keys(extracted).length) {
        result.overallMatch = false;
        result.noData = true;
        return result;
    }

    for (const size of VALID_SIZES) {
        const data = extracted[size];
        if (!data) continue;

        const std = WOHWOOH_STANDARD.sizes[size];
        if (!std) continue;

        const sizeDetail = {
            size,
            comparisons: [],
            isMatch: true,
            unit: data.unit
        };

        // Compare each measurement: bust, waist, hips, sleeve
        WOHWOOH_STANDARD.keys.forEach(key => {
            if (data[key] === undefined || data[key] === null) return;

            result.totalChecked++;
            const uploadVal = data[key];
            const standardMin = std[key].min;
            const standardMax = std[key].max;
            const diff = uploadVal - standardMin;

            // MATCH: upload >= (MIN - tolerance)
            // Nghĩa là: thừa hoặc đủ → MATCH, thiếu quá tolerance → UNMATCH
            const isMatch = uploadVal >= (standardMin - tolInch);

            if (isMatch) {
                result.totalMatched++;
            } else {
                sizeDetail.isMatch = false;
            }

            sizeDetail.comparisons.push({
                key,
                label: WOHWOOH_STANDARD.labels[key],
                uploaded: round2(uploadVal),
                standardMin,
                standardMax,
                diff: round2(diff),
                isMatch
            });
        });

        if (sizeDetail.comparisons.length > 0) {
            if (sizeDetail.isMatch) {
                result.matchedSizes.push(size);
            } else {
                result.unmatchedSizes.push(size);
                result.overallMatch = false;
            }
            result.details.push(sizeDetail);
        }
    }

    if (!result.details.length) {
        result.overallMatch = false;
        result.noData = true;
    }

    return result;
}

// ==================================================================
// DISPLAY RESULTS
// ==================================================================
function displaySummary(total, match, unmatch) {
    const pct = total ? Math.round((match / total) * 100) : 0;
    DOM.resultsSummary.innerHTML = `
        <div class="summary-item total"><div class="number">${total}</div><div class="label">Tổng ảnh</div></div>
        <div class="summary-item match"><div class="number">${match}</div><div class="label">✓ MATCH</div></div>
        <div class="summary-item unmatch"><div class="number">${unmatch}</div><div class="label">✗ UNMATCH</div></div>
        <div class="summary-item percent"><div class="number">${pct}%</div><div class="label">Tỷ lệ</div></div>
    `;
}

function displayResult(result, index) {
    let body = '';

    if (result.comparison.noData) {
        body = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không trích xuất được dữ liệu size</p>
                <small>
                    • Ảnh không rõ nét<br>
                    • Bảng size không đọc được<br>
                    • Text bị nhiễu<br><br>
                    <strong>Gợi ý:</strong> Upload ảnh chất lượng cao hơn
                </small>
            </div>`;
    } else {
        const tolInch = (tolerance / 2.54).toFixed(2);

        body = `
            <div class="comparison-info">
                <span class="info-badge"><i class="fas fa-ruler"></i> Dung sai: ±${tolerance}cm (±${tolInch}")</span>
                <span class="info-badge"><i class="fas fa-exchange-alt"></i> Đơn vị gốc: ${result.comparison.details[0]?.unit || 'inch'}</span>
                <span class="info-badge"><i class="fas fa-arrow-up"></i> Upload ≥ MIN = MATCH</span>
            </div>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Chỉ số</th>
                        <th>Ảnh Upload</th>
                        <th>Chuẩn US<br><small>(MIN - MAX)</small></th>
                        <th>So với MIN</th>
                        <th>Kết quả</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.comparison.details.map(d => {
            return d.comparisons.map((c, i) => `
                            <tr>
                                ${i === 0 ? `<td class="size-col" rowspan="${d.comparisons.length}">${d.size}</td>` : ''}
                                <td>${c.label}</td>
                                <td><strong>${c.uploaded}"</strong></td>
                                <td>${c.standardMin}" - ${c.standardMax}"</td>
                                <td>${c.diff > 0 ? '+' : ''}${c.diff}"</td>
                                <td class="${c.isMatch ? 'match-cell' : 'unmatch-cell'}">
                                    ${c.isMatch ? (c.diff >= 0 ? '✓ Đủ/Thừa' : '✓ OK (trong dung sai)') : '✗ Thiếu'}
                                </td>
                            </tr>
                        `).join('');
        }).join('')}
                </tbody>
            </table>
            <div class="size-summary">
                ${result.comparison.matchedSizes.length ? `<span class="size-badge match">✓ Match: ${result.comparison.matchedSizes.join(', ')}</span>` : ''}
                ${result.comparison.unmatchedSizes.length ? `<span class="size-badge unmatch">✗ Unmatch: ${result.comparison.unmatchedSizes.join(', ')}</span>` : ''}
            </div>`;
    }

    DOM.resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${result.image.src}" class="result-image" alt="${index}">
                    <div class="result-title">
                        <h4>Ảnh #${index}</h4>
                        <small>${result.image.name.substring(0, 35)}</small>
                    </div>
                </div>
                <span class="result-status ${result.status}">
                    ${result.status === 'match' ? '✓ MATCH' : '✗ UNMATCH'}
                </span>
            </div>
            ${body}
            <details class="extracted-data">
                <summary><i class="fas fa-file-alt"></i> OCR Debug</summary>
                <pre>${escapeHtml(result.text)}</pre>
            </details>
        </div>
    `);
}

function displayError(img, index, error) {
    DOM.resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="result-item unmatch">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${img.src}" class="result-image" alt="${index}">
                    <div class="result-title"><h4>Ảnh #${index}</h4><small>${img.name}</small></div>
                </div>
                <span class="result-status unmatch">⚠ LỖI</span>
            </div>
            <div class="no-data-message"><i class="fas fa-exclamation-circle"></i><p>${error}</p></div>
        </div>
    `);
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

// ==================================================================
// LOADING & TOAST
// ==================================================================
function showLoading(t) {
    DOM.loadingOverlay.classList.add('active');
    DOM.loadingText.textContent = t;
    DOM.loadingDetail.textContent = '';
    DOM.progress.style.width = '0%';
}
function hideLoading() { DOM.loadingOverlay.classList.remove('active'); }
function updateLoadingText(t) { DOM.loadingText.textContent = t; }
function updateLoadingDetail(t) { DOM.loadingDetail.textContent = t; }
function updateProgress(p) { DOM.progress.style.width = `${Math.min(100, Math.max(0, p))}%`; }

function showToast(msg, type = 'info') {
    const icons = {
        success: 'fa-check-circle', error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle', info: 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icons[type]}"></i> <span>${msg}</span>`;
    DOM.toastContainer.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(100%)';
        setTimeout(() => t.remove(), 300);
    }, 4000);
}

console.log('📐 Size Comparison Tool v3.1');
console.log('📋 https://wohwooh.com/pages/size-guide');
