/**
 * Size Comparison Tool v3.0
 * Tiêu chuẩn: https://wohwooh.com/pages/size-guide
 * 
 * LOGIC:
 * - Ảnh upload >= Chuẩn US → MATCH
 * - Ảnh upload <  Chuẩn US → UNMATCH
 * - Chỉ so sánh US (bỏ qua UK nếu có)
 * - Sizes: S, M, L, XL only
 */

// ==================================================================
// US SIZE STANDARD - Chính xác từ https://wohwooh.com/pages/size-guide
// Thứ tự: Bust/Chest, Waist, Hips, Length (theo đúng WohWooh)
// ==================================================================
const WOHWOOH_STANDARD = {
    // TOPS - T-Shirt, Hoodie, Sweatshirt (Unisex)
    tops: {
        title: "Tops (T-Shirt, Hoodie, Sweatshirt)",
        headers: ["Size", "Length", "½ Chest", "Sleeve Length"],
        headersVi: ["Size", "Dài áo", "½ Ngực", "Dài tay"],
        keys: ["length", "half_chest", "sleeve"],
        sizes: {
            "S":  { length: 28,   half_chest: 20,   sleeve: 8.26  },
            "M":  { length: 29,   half_chest: 21,   sleeve: 8.66  },
            "L":  { length: 30,   half_chest: 23,   sleeve: 9.06  },
            "XL": { length: 31,   half_chest: 25,   sleeve: 9.45  }
        }
    },
    // Full body measurements (Bust, Waist, Hips)
    body: {
        title: "Body Measurements (Ngực, Eo, Mông)",
        headers: ["Size", "Bust/Chest", "Waist", "Hips"],
        headersVi: ["Size", "Ngực", "Eo", "Mông"],
        keys: ["bust", "waist", "hips"],
        sizes: {
            "S":  { bust: 36,  waist: 28,  hips: 38  },
            "M":  { bust: 40,  waist: 32,  hips: 42  },
            "L":  { bust: 44,  waist: 36,  hips: 46  },
            "XL": { bust: 48,  waist: 40,  hips: 50  }
        }
    }
};

// All measurement labels
const LABELS = {
    length: "Length (Dài)",
    half_chest: "½ Chest (½ Ngực)",
    sleeve: "Sleeve (Tay áo)",
    bust: "Bust/Chest (Ngực)",
    waist: "Waist (Eo)",
    hips: "Hips (Mông)",
    chest: "Chest (Ngực)",
    width: "Width (Rộng)"
};

// Valid sizes only
const VALID_SIZES = ["S", "M", "L", "XL"];

// ==================================================================
// GLOBAL
// ==================================================================
let uploadedImages = [];
let tolerance = 2;
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
    standardTables: $('#standard-tables'),
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
    loadStandardTables();
    initTabs();
    initDropzone();
    initUrlInputs();
    initSettings();
    initButtons();
    showToast('Sẵn sàng! Upload tối đa 5 ảnh bảng size.', 'info');
});

// ==================================================================
// STANDARD TABLES
// ==================================================================
function loadStandardTables() {
    let html = '';
    
    // Tops table
    html += buildStandardTable(WOHWOOH_STANDARD.tops);
    // Body table  
    html += buildStandardTable(WOHWOOH_STANDARD.body);
    
    DOM.standardTables.innerHTML = html;
}

function buildStandardTable(category) {
    let html = `<div class="standard-table-title"><i class="fas fa-tshirt"></i> ${category.title}</div>`;
    html += '<table class="standard-table"><thead><tr>';
    
    category.headers.forEach((h, i) => {
        html += `<th>${h}<br><small>${category.headersVi[i]}</small></th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    Object.entries(category.sizes).forEach(([size, data]) => {
        html += `<tr><td><strong>${size}</strong></td>`;
        category.keys.forEach(key => {
            html += `<td>${data[key]}"</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

// ==================================================================
// TABS
// ==================================================================
function initTabs() {
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            DOM.tabContents.forEach(c => c.classList.toggle('active', c.id === `${btn.dataset.tab}-tab`));
        });
    });
}

// ==================================================================
// DROPZONE
// ==================================================================
function initDropzone() {
    const dz = DOM.dropzone;
    ['dragenter','dragover','dragleave','drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }));
    ['dragenter','dragover'].forEach(e => dz.addEventListener(e, () => dz.classList.add('dragover')));
    ['dragleave','drop'].forEach(e => dz.addEventListener(e, () => dz.classList.remove('dragover')));
    dz.addEventListener('drop', e => e.dataTransfer.files.length && handleFiles(e.dataTransfer.files));
    dz.addEventListener('click', e => { if(!e.target.closest('.file-label')) DOM.fileInput.click(); });
    DOM.fileInput.addEventListener('change', e => { e.target.files.length && handleFiles(e.target.files); e.target.value=''; });
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
        reader.onload = e => resolve({ id: `f_${Date.now()}_${i}`, type:'file', name: file.name, src: e.target.result, size: file.size });
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
    } catch(e) {
        showToast('Lỗi đọc file!', 'error');
    }
}

// ==================================================================
// URL
// ==================================================================
function initUrlInputs() {
    DOM.addUrlBtn.addEventListener('click', () => {
        if (DOM.urlInputs.children.length >= 5) return showToast('Tối đa 5 URL!', 'warning');
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
            .map(i => i.value.trim()).filter(u => { try { new URL(u); return true; } catch { return false; } });
        
        if (!urls.length) return showToast('Nhập URL hợp lệ!', 'warning');
        const remain = 5 - uploadedImages.length;
        if (remain <= 0) return showToast('Đã đủ 5 ảnh!', 'warning');

        showLoading('Đang tải ảnh...');
        let ok = 0;
        for (let i = 0; i < Math.min(urls.length, remain); i++) {
            try {
                updateLoadingText(`Tải ảnh ${i+1}/${urls.length}...`);
                const src = await fetchImg(urls[i]);
                uploadedImages.push({ id:`u_${Date.now()}_${i}`, type:'url', name: urls[i].split('/').pop()||`Img${i+1}`, src });
                ok++;
            } catch(e) { showToast(`Lỗi tải: ${urls[i].substring(0,30)}...`, 'error'); }
        }
        hideLoading();
        updatePreview();
        if (ok) showToast(`Tải ${ok} ảnh! (${uploadedImages.length}/5)`, 'success');
    });
}

function fetchImg(url) {
    return new Promise((res, rej) => {
        const img = new Image(); img.crossOrigin='Anonymous';
        const t = setTimeout(() => rej('Timeout'), 15000);
        img.onload = () => { clearTimeout(t); const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); res(c.toDataURL('image/png')); };
        img.onerror = () => { clearTimeout(t);
            const p = new Image(); p.crossOrigin='Anonymous';
            p.onload = () => { const c=document.createElement('canvas'); c.width=p.width; c.height=p.height; c.getContext('2d').drawImage(p,0,0); res(c.toDataURL('image/png')); };
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
        d.innerHTML = `<img src="${img.src}" alt="${img.name}"><button class="remove-btn" onclick="removeImage(${i})"><i class="fas fa-times"></i></button><span class="image-index">#${i+1}</span>`;
        DOM.previewGrid.appendChild(d);
    });
}

window.removeImage = i => { uploadedImages.splice(i,1); updatePreview(); showToast('Đã xóa!','info'); };
window.clearAllImages = () => { uploadedImages=[]; updatePreview(); DOM.resultsCard.style.display='none'; showToast('Đã xóa tất cả!','info'); };

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
// COMPARISON ENGINE
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
        updateProgress((i/total)*100);
        updateLoadingText(`Xử lý ảnh ${num}/${total}...`);
        updateLoadingDetail(uploadedImages[i].name);

        try {
            const result = await processOneImage(uploadedImages[i], num, total);
            result.status === 'match' ? matchCount++ : unmatchCount++;
            displayResult(result, num);
        } catch(e) {
            unmatchCount++;
            displayError(uploadedImages[i], num, e.message);
        }
        updateProgress(((i+1)/total)*100);
    }

    displaySummary(total, matchCount, unmatchCount);
    hideLoading();
    isProcessing = false;
    DOM.compareBtn.disabled = false;

    if (matchCount === total) showToast(`✅ Tất cả ${total} ảnh MATCH!`, 'success');
    else if (unmatchCount === total) showToast(`❌ Tất cả ${total} ảnh UNMATCH!`, 'error');
    else showToast(`${matchCount} MATCH, ${unmatchCount} UNMATCH`, 'info');
}

async function processOneImage(imageData, current, total) {
    // Load
    const img = await new Promise((res, rej) => {
        const i = new Image(); i.crossOrigin='Anonymous';
        i.onload = () => res(i); i.onerror = () => rej(new Error('Load failed'));
        i.src = imageData.src;
    });

    // Enhance
    let canvas;
    if (DOM.enhanceCheckbox.checked) {
        updateLoadingDetail('Làm rõ ảnh...');
        canvas = enhanceImage(img);
    } else {
        canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
    }

    // OCR - Run TWICE with different settings for better accuracy
    updateLoadingDetail('OCR lần 1...');
    const text1 = await ocrScan(canvas, current, total);
    
    // Try without enhancement too
    updateLoadingDetail('OCR lần 2 (ảnh gốc)...');
    const origCanvas = document.createElement('canvas');
    const scale2 = Math.max(2, 1800 / Math.max(img.width, img.height));
    origCanvas.width = img.width * scale2;
    origCanvas.height = img.height * scale2;
    const ctx2 = origCanvas.getContext('2d');
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = 'high';
    ctx2.drawImage(img, 0, 0, origCanvas.width, origCanvas.height);
    
    const text2 = await ocrScan(origCanvas, current, total);

    // Combine both OCR results
    const combinedText = text1 + '\n---SCAN2---\n' + text2;
    console.log('Combined OCR text:', combinedText.substring(0, 600));

    // Parse
    updateLoadingDetail('Phân tích dữ liệu...');
    const measurements = parseOCRText(combinedText);

    // Compare
    const comparison = compareMeasurements(measurements);

    return {
        image: imageData,
        text: combinedText,
        measurements,
        comparison,
        status: comparison.overallMatch ? 'match' : 'unmatch'
    };
}

function enhanceImage(img) {
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
        let g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
        g = Math.max(0, Math.min(255, ((g-128)*1.6)+128));
        const v = g > 130 ? 255 : 0;
        d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(id, 0, 0);
    return canvas;
}

async function ocrScan(canvas, current, total) {
    const result = await Tesseract.recognize(canvas, 'eng', {
        logger: m => {
            if (m.status === 'recognizing text') {
                updateProgress(((current-1)/total)*100 + (m.progress*40)/total);
            }
        }
    });
    return result.data.text;
}

// ==================================================================
// TEXT PARSING - Improved to catch ALL sizes including S
// ==================================================================
function parseOCRText(rawText) {
    const results = {};
    
    // Detect unit
    const lower = rawText.toLowerCase();
    const isCm = lower.includes('cm') || lower.includes('厘米') || lower.includes('centimeter') || lower.includes('centimet');
    console.log('Unit detected:', isCm ? 'CM' : 'INCH');

    // Clean text
    const text = rawText
        .replace(/\|/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/,/g, '.')
        .replace(/\s+/g, ' ');

    // Split into lines
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Strategy 1: Line-by-line - find lines containing sizes
    for (const line of lines) {
        // Skip lines with UK
        if (/\bUK\b/i.test(line) && !/\bUS\b/i.test(line)) continue;
        
        // Find size in line
        const sizeMatch = line.match(/\b(S|M|L|XL)\b/i);
        if (!sizeMatch) continue;
        
        const size = sizeMatch[1].toUpperCase();
        if (!VALID_SIZES.includes(size)) continue;
        
        // Don't overwrite if already found
        if (results[size] && results[size]._numberCount > 2) continue;

        // Extract all numbers from this line
        const nums = [];
        const numPattern = /(\d+\.?\d*)/g;
        let nm;
        while ((nm = numPattern.exec(line)) !== null) {
            const val = parseFloat(nm[1]);
            // Filter reasonable measurement values
            if (val >= 5 && val <= 90) {
                nums.push(val);
            }
        }

        if (nums.length >= 2) {
            results[size] = {
                rawNumbers: nums,
                _numberCount: nums.length,
                unit: isCm ? 'cm' : 'inch'
            };
            console.log(`Line parse - Size ${size}: [${nums.join(', ')}]`);
        }
    }

    // Strategy 2: Pattern matching on full text
    const fullText = text.replace(/\n/g, ' ');
    
    // Pattern: "S" followed by numbers
    for (const size of VALID_SIZES) {
        if (results[size] && results[size]._numberCount >= 2) continue;
        
        // Find size and grab following numbers
        const patterns = [
            new RegExp(`\\b${size}\\b[^A-Za-z]*?(\\d+\\.?\\d*)[^\\d]+(\\d+\\.?\\d*)(?:[^\\d]+(\\d+\\.?\\d*))?(?:[^\\d]+(\\d+\\.?\\d*))?(?:[^\\d]+(\\d+\\.?\\d*))?`, 'i'),
            // Also try with size after numbers for some formats
            new RegExp(`(\\d+\\.?\\d*)[^\\d]+(\\d+\\.?\\d*)[^\\d]*\\b${size}\\b`, 'i')
        ];
        
        for (const pat of patterns) {
            const m = fullText.match(pat);
            if (m) {
                const nums = [m[1], m[2], m[3], m[4], m[5]]
                    .filter(n => n !== undefined)
                    .map(n => parseFloat(n))
                    .filter(n => !isNaN(n) && n >= 5 && n <= 90);
                
                if (nums.length >= 2) {
                    results[size] = {
                        rawNumbers: nums,
                        _numberCount: nums.length,
                        unit: isCm ? 'cm' : 'inch'
                    };
                    console.log(`Pattern parse - Size ${size}: [${nums.join(', ')}]`);
                    break;
                }
            }
        }
    }

    // Strategy 3: Table structure - find rows of numbers
    if (Object.keys(results).length < 2) {
        console.log('Trying table structure parsing...');
        
        // Find all numbers grouped by proximity
        const allNums = [];
        const numPat = /\d+\.?\d*/g;
        let nm2;
        while ((nm2 = numPat.exec(fullText)) !== null) {
            const v = parseFloat(nm2[0]);
            if (v >= 5 && v <= 90) allNums.push(v);
        }
        
        // Find all sizes in order of appearance
        const sizeOrder = [];
        const sizePat = /\b(S|M|L|XL)\b/gi;
        let sm;
        while ((sm = sizePat.exec(fullText)) !== null) {
            const s = sm[1].toUpperCase();
            if (VALID_SIZES.includes(s) && !sizeOrder.includes(s)) {
                sizeOrder.push(s);
            }
        }
        
        if (sizeOrder.length >= 2 && allNums.length >= sizeOrder.length * 2) {
            const perSize = Math.floor(allNums.length / sizeOrder.length);
            sizeOrder.forEach((size, idx) => {
                if (results[size] && results[size]._numberCount >= 2) return;
                const start = idx * perSize;
                const nums = allNums.slice(start, start + perSize);
                if (nums.length >= 2) {
                    results[size] = { rawNumbers: nums, _numberCount: nums.length, unit: isCm ? 'cm' : 'inch' };
                    console.log(`Table parse - Size ${size}: [${nums.join(', ')}]`);
                }
            });
        }
    }

    // Convert numbers to measurements
    Object.keys(results).forEach(size => {
        const data = results[size];
        const nums = data.rawNumbers;
        const u = data.unit;
        
        // Convert to inch if cm
        const toInch = v => u === 'cm' ? Math.round((v / 2.54) * 100) / 100 : v;
        
        // Map numbers to measurements
        // Most common format: length, half_chest/width, sleeve
        // Or: bust, waist, hips, length
        // We'll try to match by comparing with standard values
        
        const mapped = {};
        
        if (nums.length === 2) {
            mapped.length = toInch(nums[0]);
            mapped.half_chest = toInch(nums[1]);
        } else if (nums.length === 3) {
            mapped.length = toInch(nums[0]);
            mapped.half_chest = toInch(nums[1]);
            mapped.sleeve = toInch(nums[2]);
        } else if (nums.length >= 4) {
            // Could be: bust, waist, hips, length  OR  length, width, chest, sleeve
            // Check if first number looks like bust (30-50 range typically)
            const first = toInch(nums[0]);
            const stdBust = WOHWOOH_STANDARD.body.sizes[size]?.bust;
            const stdLen = WOHWOOH_STANDARD.tops.sizes[size]?.length;
            
            if (stdBust && Math.abs(first - stdBust) < Math.abs(first - (stdLen || 30))) {
                // Looks like body measurements: bust, waist, hips, [length]
                mapped.bust = toInch(nums[0]);
                mapped.waist = toInch(nums[1]);
                mapped.hips = toInch(nums[2]);
                if (nums[3]) mapped.length = toInch(nums[3]);
            } else {
                // Looks like garment measurements
                mapped.length = toInch(nums[0]);
                mapped.half_chest = toInch(nums[1]);
                if (nums[2]) {
                    const v = toInch(nums[2]);
                    // If value > 20, likely chest (full), else sleeve
                    if (v > 20) {
                        mapped.bust = v;
                    } else {
                        mapped.sleeve = v;
                    }
                }
                if (nums[3]) mapped.sleeve = toInch(nums[3]);
            }
        }
        
        results[size] = { ...mapped, unit: u, rawNumbers: nums };
    });

    return results;
}

// ==================================================================
// COMPARISON - Upload >= Standard = MATCH, Upload < Standard = UNMATCH
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

        const sizeDetail = { size, comparisons: [], isMatch: true, unit: data.unit };

        // Compare with TOPS standard
        const stdTops = WOHWOOH_STANDARD.tops.sizes[size];
        if (stdTops) {
            ['length', 'half_chest', 'sleeve'].forEach(key => {
                if (data[key] === undefined) return;
                const ext = data[key];
                const std = stdTops[key];
                doCompare(sizeDetail, key, ext, std, tolInch, result);
            });
        }

        // Compare with BODY standard
        const stdBody = WOHWOOH_STANDARD.body.sizes[size];
        if (stdBody) {
            ['bust', 'waist', 'hips'].forEach(key => {
                if (data[key] === undefined) return;
                const ext = data[key];
                const std = stdBody[key];
                doCompare(sizeDetail, key, ext, std, tolInch, result);
            });

            // Also check if half_chest * 2 matches bust
            if (data.half_chest && !data.bust) {
                const fullChest = data.half_chest * 2;
                doCompare(sizeDetail, 'bust (½×2)', fullChest, stdBody.bust, tolInch, result);
            }
        }

        if (sizeDetail.comparisons.length > 0) {
            if (!sizeDetail.isMatch) {
                result.unmatchedSizes.push(size);
                result.overallMatch = false;
            } else {
                result.matchedSizes.push(size);
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

function doCompare(sizeDetail, key, extracted, standard, tolInch, result) {
    result.totalChecked++;
    const diff = extracted - standard;
    
    // MATCH logic: ảnh upload >= chuẩn US (hoặc thiếu trong dung sai)
    // UNMATCH: ảnh upload < chuẩn US (thiếu quá dung sai)
    const isMatch = diff >= -tolInch; // extracted >= standard - tolerance
    
    if (isMatch) result.totalMatched++;
    else sizeDetail.isMatch = false;

    sizeDetail.comparisons.push({
        key,
        label: LABELS[key] || key,
        extracted: Math.round(extracted * 100) / 100,
        standard,
        diff: Math.round(diff * 100) / 100,
        isMatch
    });
}

// ==================================================================
// DISPLAY
// ==================================================================
function displaySummary(total, match, unmatch) {
    const pct = total ? Math.round((match/total)*100) : 0;
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
                    • Ảnh không rõ nét / độ phân giải thấp<br>
                    • Bảng size không theo định dạng chuẩn<br>
                    • Text bị nhiễu hoặc che khuất<br><br>
                    <strong>Gợi ý:</strong> Upload ảnh chất lượng cao hơn
                </small>
            </div>`;
    } else {
        const tolInch = (tolerance/2.54).toFixed(2);
        body = `
            <div class="comparison-info">
                <span class="info-badge"><i class="fas fa-ruler"></i> Dung sai: ±${tolerance}cm (±${tolInch}")</span>
                <span class="info-badge"><i class="fas fa-exchange-alt"></i> Gốc: ${result.comparison.details[0]?.unit || 'inch'}</span>
                <span class="info-badge"><i class="fas fa-info-circle"></i> Upload ≥ Chuẩn = MATCH</span>
            </div>
            <table class="comparison-table">
                <thead><tr>
                    <th>Size</th><th>Chỉ số</th><th>Ảnh upload</th><th>Chuẩn US</th><th>Chênh lệch</th><th>Kết quả</th>
                </tr></thead>
                <tbody>
                ${result.comparison.details.map(d => {
                    return d.comparisons.map((c, i) => `
                        <tr>
                            ${i===0 ? `<td class="size-col" rowspan="${d.comparisons.length}">${d.size}</td>` : ''}
                            <td>${c.label}</td>
                            <td><strong>${c.extracted}"</strong></td>
                            <td>${c.standard}"</td>
                            <td>${c.diff > 0 ? '+' : ''}${c.diff}"</td>
                            <td class="${c.isMatch ? 'match-cell' : 'unmatch-cell'}">${c.isMatch ? '✓ OK' : '✗ Thiếu'}</td>
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
                        <small>${result.image.name.substring(0,35)}</small>
                    </div>
                </div>
                <span class="result-status ${result.status}">${result.status==='match' ? '✓ MATCH' : '✗ UNMATCH'}</span>
            </div>
            ${body}
            <details class="extracted-data">
                <summary><i class="fas fa-file-alt"></i> OCR Debug Text</summary>
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

function escapeHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

// ==================================================================
// LOADING & TOAST
// ==================================================================
function showLoading(t='Đang xử lý...') { DOM.loadingOverlay.classList.add('active'); DOM.loadingText.textContent=t; DOM.loadingDetail.textContent=''; DOM.progress.style.width='0%'; }
function hideLoading() { DOM.loadingOverlay.classList.remove('active'); }
function updateLoadingText(t) { DOM.loadingText.textContent=t; }
function updateLoadingDetail(t) { DOM.loadingDetail.textContent=t; }
function updateProgress(p) { DOM.progress.style.width=`${Math.min(100,Math.max(0,p))}%`; }

function showToast(msg, type='info') {
    const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icons[type]}"></i> <span>${msg}</span>`;
    DOM.toastContainer.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; setTimeout(()=>t.remove(),300); }, 4000);
}

console.log('📐 Size Comparison Tool v3.0 loaded');
console.log('📋 Standard: https://wohwooh.com/pages/size-guide');
