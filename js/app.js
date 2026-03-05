/**
 * Size Comparison Tool v2.1
 * So sánh kích thước với tiêu chuẩn US Size từ WohWooh.com
 * https://wohwooh.com/pages/size-guide
 */

// ==================== US SIZE STANDARDS (WohWooh.com) ====================
const US_SIZE_STANDARD = {
    name: "US Size Standard (WohWooh)",
    unit: "inch",
    sizes: {
        "S":   { length: 28.00, width: 18.00, chest: 36.00, sleeve: 8.25 },
        "M":   { length: 29.00, width: 20.00, chest: 40.00, sleeve: 8.63 },
        "L":   { length: 30.00, width: 22.00, chest: 44.00, sleeve: 9.00 },
        "XL":  { length: 31.00, width: 24.00, chest: 48.00, sleeve: 9.38 },
        "2XL": { length: 32.00, width: 26.00, chest: 52.00, sleeve: 9.75 },
        "3XL": { length: 33.00, width: 28.00, chest: 56.00, sleeve: 10.13 },
        "4XL": { length: 34.00, width: 30.00, chest: 60.00, sleeve: 10.50 },
        "5XL": { length: 35.00, width: 32.00, chest: 64.00, sleeve: 10.88 }
    },
    measurementLabels: {
        length: "Length (Chiều dài)",
        width: "Width (Chiều rộng)", 
        chest: "Chest (Vòng ngực)",
        sleeve: "Sleeve (Tay áo)"
    }
};

// ==================== GLOBAL VARIABLES ====================
let uploadedImages = [];
let tolerance = 2;
let isProcessing = false;

// ==================== DOM ELEMENTS ====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    fileInput: $('#file-input'),
    dropzone: $('#dropzone'),
    urlInputs: $('#url-inputs'),
    addUrlBtn: $('#add-url-btn'),
    loadUrlsBtn: $('#load-urls-btn'),
    toleranceInput: $('#tolerance'),
    toleranceInch: $('#tolerance-inch'),
    toleranceDisplay: $('#tolerance-display'),
    enhanceCheckbox: $('#enhance-image'),
    previewSection: $('#preview-section'),
    previewGrid: $('#preview-grid'),
    imageCount: $('#image-count'),
    clearAllBtn: $('#clear-all-btn'),
    compareBtn: $('#compare-btn'),
    standardTbody: $('#standard-tbody'),
    resultsCard: $('#results-card'),
    resultsSummary: $('#results-summary'),
    resultsContainer: $('#results-container'),
    loadingOverlay: $('#loading-overlay'),
    loadingText: $('#loading-text'),
    loadingDetail: $('#loading-detail'),
    progress: $('#progress'),
    toastContainer: $('#toast-container')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('🚀 Initializing Size Comparison Tool v2.1...');
    loadStandardTable();
    initTabs();
    initDropzone();
    initUrlInputs();
    initSettings();
    initCompareButton();
    initClearAllButton();
    showToast('Sẵn sàng! Upload tối đa 5 ảnh bảng size để so sánh.', 'info');
    console.log('✅ Initialization complete!');
}

// ==================== LOAD STANDARD TABLE ====================
function loadStandardTable() {
    const tbody = DOM.standardTbody;
    tbody.innerHTML = '';
    
    Object.entries(US_SIZE_STANDARD.sizes).forEach(([size, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${size}</strong></td>
            <td>${data.length}"</td>
            <td>${data.width}"</td>
            <td>${data.chest}"</td>
            <td>${data.sleeve}"</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== TABS ====================
function initTabs() {
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            DOM.tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `${tabId}-tab`);
            });
        });
    });
}

// ==================== DROPZONE ====================
function initDropzone() {
    const dropzone = DOM.dropzone;
    const fileInput = DOM.fileInput;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        dropzone.addEventListener(event, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(event => {
        dropzone.addEventListener(event, () => dropzone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(event => {
        dropzone.addEventListener(event, () => dropzone.classList.remove('dragover'));
    });

    dropzone.addEventListener('drop', e => {
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    });

    dropzone.addEventListener('click', e => {
        if (!e.target.closest('.file-label')) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files);
            e.target.value = '';
        }
    });
}

// ==================== FILE UPLOAD ====================
async function handleFileUpload(files) {
    const fileArray = Array.from(files);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validFiles = fileArray.filter(f => validTypes.includes(f.type));

    if (validFiles.length === 0) {
        showToast('Vui lòng chọn file ảnh (PNG, JPEG, WebP)!', 'warning');
        return;
    }

    const remaining = 5 - uploadedImages.length;
    if (remaining <= 0) {
        showToast('Đã đạt giới hạn 5 ảnh! Hãy xóa bớt.', 'warning');
        return;
    }

    const filesToAdd = validFiles.slice(0, remaining);
    if (validFiles.length > remaining) {
        showToast(`Chỉ thêm được ${remaining} ảnh nữa.`, 'warning');
    }

    console.log(`📁 Processing ${filesToAdd.length} files...`);

    const readPromises = filesToAdd.map((file, idx) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                resolve({
                    id: `file_${Date.now()}_${idx}`,
                    type: 'file',
                    name: file.name,
                    src: e.target.result,
                    size: file.size
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    try {
        const results = await Promise.all(readPromises);
        results.forEach(img => {
            const exists = uploadedImages.some(
                existing => existing.name === img.name && existing.size === img.size
            );
            if (!exists) {
                uploadedImages.push(img);
                console.log(`✅ Added: ${img.name}`);
            }
        });
        updatePreview();
        showToast(`Đã thêm ${results.length} ảnh! (${uploadedImages.length}/5)`, 'success');
    } catch (err) {
        console.error('Error reading files:', err);
        showToast('Lỗi khi đọc file!', 'error');
    }
}

// ==================== URL INPUTS ====================
function initUrlInputs() {
    DOM.addUrlBtn.addEventListener('click', addUrlInput);
    DOM.loadUrlsBtn.addEventListener('click', loadUrlImages);
    
    DOM.urlInputs.addEventListener('click', e => {
        if (e.target.closest('.btn-remove-url')) {
            const group = e.target.closest('.url-input-group');
            if (DOM.urlInputs.children.length > 1) {
                group.remove();
            } else {
                group.querySelector('.url-input').value = '';
            }
        }
    });
}

function addUrlInput() {
    if (DOM.urlInputs.children.length >= 5) {
        showToast('Tối đa 5 URL!', 'warning');
        return;
    }
    const group = document.createElement('div');
    group.className = 'url-input-group';
    group.innerHTML = `
        <input type="text" class="url-input" placeholder="Nhập URL ảnh...">
        <button class="btn-remove-url" title="Xóa"><i class="fas fa-times"></i></button>
    `;
    DOM.urlInputs.appendChild(group);
}

async function loadUrlImages() {
    const inputs = DOM.urlInputs.querySelectorAll('.url-input');
    const urls = Array.from(inputs).map(i => i.value.trim()).filter(u => u && isValidUrl(u));

    if (urls.length === 0) {
        showToast('Vui lòng nhập URL hợp lệ!', 'warning');
        return;
    }

    const remaining = 5 - uploadedImages.length;
    if (remaining <= 0) {
        showToast('Đã đạt giới hạn 5 ảnh!', 'warning');
        return;
    }

    showLoading('Đang tải ảnh từ URL...');
    let loaded = 0;

    for (let i = 0; i < Math.min(urls.length, remaining); i++) {
        try {
            updateLoadingText(`Đang tải ảnh ${i + 1}/${urls.length}...`);
            const src = await fetchImage(urls[i]);
            uploadedImages.push({
                id: `url_${Date.now()}_${i}`,
                type: 'url',
                name: urls[i].split('/').pop() || `Image_${i + 1}`,
                src: src,
                originalUrl: urls[i]
            });
            loaded++;
        } catch (err) {
            console.error('Failed to load:', urls[i]);
            showToast(`Không thể tải: ${urls[i].substring(0, 30)}...`, 'error');
        }
    }

    hideLoading();
    updatePreview();
    if (loaded > 0) {
        showToast(`Đã tải ${loaded} ảnh! (${uploadedImages.length}/5)`, 'success');
    }
}

function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
}

async function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
        
        img.onload = () => {
            clearTimeout(timeout);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            const proxyImg = new Image();
            proxyImg.crossOrigin = 'Anonymous';
            proxyImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = proxyImg.width;
                canvas.height = proxyImg.height;
                canvas.getContext('2d').drawImage(proxyImg, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            proxyImg.onerror = () => reject(new Error('Failed'));
            proxyImg.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        };
        img.src = url;
    });
}

// ==================== PREVIEW ====================
function updatePreview() {
    const section = DOM.previewSection;
    const grid = DOM.previewGrid;
    const count = DOM.imageCount;

    count.textContent = uploadedImages.length;
    grid.innerHTML = '';

    if (uploadedImages.length === 0) {
        section.classList.remove('show');
        section.style.display = 'none';
        DOM.compareBtn.disabled = true;
        DOM.compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> So Sánh Kích Thước';
        return;
    }

    section.classList.add('show');
    section.style.display = 'block';
    DOM.compareBtn.disabled = false;

    uploadedImages.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${img.src}" alt="${img.name}">
            <button class="remove-btn" onclick="removeImage(${idx})" title="Xóa">
                <i class="fas fa-times"></i>
            </button>
            <span class="image-index">#${idx + 1}</span>
        `;
        grid.appendChild(item);
    });

    DOM.compareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> So Sánh ${uploadedImages.length} Ảnh`;
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updatePreview();
    showToast('Đã xóa ảnh!', 'info');
}

function clearAllImages() {
    uploadedImages = [];
    updatePreview();
    DOM.resultsCard.style.display = 'none';
    showToast('Đã xóa tất cả!', 'info');
}

function initClearAllButton() {
    if (DOM.clearAllBtn) {
        DOM.clearAllBtn.addEventListener('click', clearAllImages);
    }
}

// ==================== SETTINGS ====================
function initSettings() {
    DOM.toleranceInput.addEventListener('input', e => {
        tolerance = parseFloat(e.target.value) || 0;
        const inch = (tolerance / 2.54).toFixed(2);
        DOM.toleranceInch.textContent = inch;
        if (DOM.toleranceDisplay) DOM.toleranceDisplay.textContent = tolerance;
    });
}

// ==================== COMPARE ====================
function initCompareButton() {
    DOM.compareBtn.addEventListener('click', runComparison);
}

async function runComparison() {
    if (uploadedImages.length === 0) {
        showToast('Vui lòng upload ít nhất 1 ảnh!', 'error');
        return;
    }

    if (isProcessing) {
        showToast('Đang xử lý...', 'warning');
        return;
    }

    isProcessing = true;
    DOM.compareBtn.disabled = true;

    showLoading('Khởi tạo OCR engine...');
    DOM.resultsContainer.innerHTML = '';
    DOM.resultsSummary.innerHTML = '';
    DOM.resultsCard.style.display = 'block';

    const results = [];
    let matchCount = 0;
    let unmatchCount = 0;
    const total = uploadedImages.length;

    console.log(`\n========== STARTING COMPARISON (${total} images) ==========\n`);

    for (let i = 0; i < total; i++) {
        const img = uploadedImages[i];
        const num = i + 1;

        console.log(`\n--- Image ${num}: ${img.name} ---`);
        updateProgress((i / total) * 100);
        updateLoadingText(`Đang xử lý ảnh ${num}/${total}...`);
        updateLoadingDetail(img.name);

        try {
            const result = await processImage(img, num, total);
            results.push(result);

            if (result.status === 'match') {
                matchCount++;
                console.log(`✅ Image ${num}: MATCH`);
            } else {
                unmatchCount++;
                console.log(`❌ Image ${num}: UNMATCH`);
            }
            displayResult(result, num);
        } catch (err) {
            console.error(`Error processing image ${num}:`, err);
            unmatchCount++;
            displayErrorResult(img, num, err.message);
        }
        updateProgress(((i + 1) / total) * 100);
    }

    displaySummary(total, matchCount, unmatchCount);
    hideLoading();
    isProcessing = false;
    DOM.compareBtn.disabled = false;

    if (matchCount === total) {
        showToast(`✅ Tuyệt vời! Tất cả ${total} ảnh đều MATCH!`, 'success');
    } else if (unmatchCount === total) {
        showToast(`❌ Tất cả ${total} ảnh đều UNMATCH!`, 'error');
    } else {
        showToast(`Hoàn tất: ${matchCount} MATCH, ${unmatchCount} UNMATCH`, 'info');
    }
}

// ==================== IMAGE PROCESSING ====================
async function processImage(imageData, current, total) {
    const enhance = DOM.enhanceCheckbox.checked;

    updateLoadingDetail('Đang tải ảnh...');
    const img = await loadImage(imageData.src);

    let canvas;
    if (enhance) {
        updateLoadingDetail('Đang xử lý và làm rõ ảnh...');
        canvas = enhanceForOCR(img);
    } else {
        canvas = toCanvas(img);
    }

    updateLoadingDetail('Đang nhận dạng text (OCR)...');
    const text = await runOCR(canvas, current, total);
    console.log('OCR Text:', text.substring(0, 500));

    updateLoadingDetail('Đang phân tích dữ liệu size...');
    const measurements = parseText(text);
    console.log('Parsed measurements:', measurements);

    const comparison = compare(measurements);

    return {
        image: imageData,
        text: text,
        measurements: measurements,
        comparison: comparison,
        status: comparison.isMatch ? 'match' : 'unmatch'
    };
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Cannot load image'));
        img.src = src;
    });
}

function toCanvas(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
}

function enhanceForOCR(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Scale up for better OCR
    const scale = Math.max(2, Math.min(3, 2000 / Math.max(img.width, img.height)));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Grayscale + Contrast + Threshold
    for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray = ((gray - 128) * 1.8) + 128;
        gray = Math.max(0, Math.min(255, gray));
        const val = gray > 140 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

async function runOCR(canvas, current, total) {
    try {
        const result = await Tesseract.recognize(canvas, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const base = ((current - 1) / total) * 100;
                    const step = (m.progress * 80) / total;
                    updateProgress(base + step);
                }
            }
        });
        return result.data.text;
    } catch (e) {
        throw new Error('OCR failed: ' + e.message);
    }
}

// ==================== TEXT PARSING ====================
function parseText(text) {
    const measurements = {};
    
    // Detect unit
    const lower = text.toLowerCase();
    const isCm = lower.includes('cm') || lower.includes('厘米') || lower.includes('centimeter');
    const unit = isCm ? 'cm' : 'inch';
    
    console.log('Detected unit:', unit);

    // Clean text
    const cleanText = text
        .replace(/[oO]/g, '0')
        .replace(/[lI|]/g, '1')
        .replace(/,/g, '.')
        .replace(/\s+/g, ' ');

    // Pattern: Size followed by numbers
    const pattern = /\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|XXXL)\b[\s:,\-\.]*(\d+\.?\d*)[\s,\-\.]+(\d+\.?\d*)[\s,\-\.]*(\d+\.?\d*)?[\s,\-\.]*(\d+\.?\d*)?/gi;
    
    let match;
    while ((match = pattern.exec(cleanText)) !== null) {
        const size = normalizeSize(match[1]);
        const nums = [match[2], match[3], match[4], match[5]]
            .filter(n => n !== undefined)
            .map(n => parseFloat(n))
            .filter(n => !isNaN(n) && n > 0 && n < 100);
        
        if (nums.length >= 2 && US_SIZE_STANDARD.sizes[size]) {
            const length = isCm ? cmToInch(nums[0]) : nums[0];
            const width = isCm ? cmToInch(nums[1]) : nums[1];
            
            measurements[size] = {
                unit: unit,
                rawValues: nums,
                length: round2(length),
                width: round2(width),
                chest: round2(width * 2)
            };
            
            if (nums[2] !== undefined) {
                const val = isCm ? cmToInch(nums[2]) : nums[2];
                if (val > width * 1.5) {
                    measurements[size].chest = round2(val);
                    if (nums[3]) measurements[size].sleeve = round2(isCm ? cmToInch(nums[3]) : nums[3]);
                } else {
                    measurements[size].sleeve = round2(val);
                }
            }
            console.log(`Found size ${size}:`, measurements[size]);
        }
    }

    // Fallback parsing
    if (Object.keys(measurements).length === 0) {
        console.log('Trying fallback parsing...');
        
        const sizeMatches = cleanText.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|XXXL)\b/gi) || [];
        const sizes = [...new Set(sizeMatches.map(normalizeSize))].filter(s => US_SIZE_STANDARD.sizes[s]);
        const numbers = cleanText.match(/\d+\.?\d*/g)?.map(n => parseFloat(n)).filter(n => n >= 5 && n <= 80) || [];
        
        console.log('Found sizes:', sizes);
        console.log('Found numbers:', numbers);

        if (sizes.length > 0 && numbers.length >= sizes.length * 2) {
            const numPerSize = Math.floor(numbers.length / sizes.length);
            
            sizes.forEach((size, idx) => {
                const start = idx * numPerSize;
                const sizeNums = numbers.slice(start, start + numPerSize);
                
                if (sizeNums.length >= 2) {
                    const length = isCm ? cmToInch(sizeNums[0]) : sizeNums[0];
                    const width = isCm ? cmToInch(sizeNums[1]) : sizeNums[1];
                    
                    measurements[size] = {
                        unit: unit,
                        length: round2(length),
                        width: round2(width),
                        chest: round2(width * 2)
                    };
                    
                    if (sizeNums[2] !== undefined) {
                        const val = isCm ? cmToInch(sizeNums[2]) : sizeNums[2];
                        if (val > width * 1.5) {
                            measurements[size].chest = round2(val);
                            if (sizeNums[3]) measurements[size].sleeve = round2(isCm ? cmToInch(sizeNums[3]) : sizeNums[3]);
                        } else {
                            measurements[size].sleeve = round2(val);
                        }
                    }
                }
            });
        }
    }

    return measurements;
}

function normalizeSize(s) {
    const upper = s.toUpperCase().trim();
    const map = {
        'XXS': 'XXS', 'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L',
        'XL': 'XL', 'XXL': '2XL', '2XL': '2XL',
        'XXXL': '3XL', '3XL': '3XL', '4XL': '4XL', '5XL': '5XL'
    };
    return map[upper] || upper;
}

function cmToInch(cm) { return cm / 2.54; }
function round2(n) { return Math.round(n * 100) / 100; }

// ==================== COMPARISON ====================
function compare(extracted) {
    const toleranceInch = tolerance / 2.54;
    
    const result = {
        isMatch: true,
        details: [],
        matchedSizes: [],
        unmatchedSizes: [],
        totalChecked: 0,
        totalMatched: 0
    };

    if (Object.keys(extracted).length === 0) {
        result.isMatch = false;
        result.noData = true;
        return result;
    }

    Object.entries(extracted).forEach(([size, data]) => {
        const standard = US_SIZE_STANDARD.sizes[size];
        if (!standard) return;

        const sizeResult = {
            size: size,
            measurements: {},
            isMatch: true,
            unit: data.unit
        };

        ['length', 'width', 'chest', 'sleeve'].forEach(key => {
            if (data[key] === undefined) return;
            
            result.totalChecked++;
            const ext = data[key];
            const exp = standard[key];
            const diff = ext - exp;
            const ok = Math.abs(diff) <= toleranceInch;

            if (ok) result.totalMatched++;
            else sizeResult.isMatch = false;

            sizeResult.measurements[key] = {
                extracted: round2(ext),
                expected: exp,
                diff: round2(diff),
                isMatch: ok
            };
        });

        if (sizeResult.isMatch) {
            result.matchedSizes.push(size);
        } else {
            result.unmatchedSizes.push(size);
            result.isMatch = false;
        }
        result.details.push(sizeResult);
    });

    if (result.details.length === 0) {
        result.isMatch = false;
        result.noData = true;
    }

    return result;
}

// ==================== DISPLAY RESULTS ====================
function displaySummary(total, match, unmatch) {
    const pct = Math.round((match / total) * 100);
    DOM.resultsSummary.innerHTML = `
        <div class="summary-item total"><div class="number">${total}</div><div class="label">Tổng ảnh</div></div>
        <div class="summary-item match"><div class="number">${match}</div><div class="label">✓ MATCH</div></div>
        <div class="summary-item unmatch"><div class="number">${unmatch}</div><div class="label">✗ UNMATCH</div></div>
        <div class="summary-item percent"><div class="number">${pct}%</div><div class="label">Tỷ lệ khớp</div></div>
    `;
}

function displayResult(result, index) {
    let tableHtml = '';
    
    if (result.comparison.noData) {
        tableHtml = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể trích xuất dữ liệu size từ ảnh này</p>
                <small>
                    Nguyên nhân có thể:<br>
                    • Ảnh không rõ nét hoặc độ phân giải thấp<br>
                    • Bảng size không theo định dạng chuẩn<br>
                    • Text bị che khuất hoặc nhiễu<br><br>
                    <strong>Gợi ý:</strong> Upload ảnh chất lượng cao hơn hoặc ảnh chụp màn hình rõ ràng.
                </small>
            </div>
        `;
    } else {
        const toleranceInch = (tolerance / 2.54).toFixed(2);
        tableHtml = `
            <div class="comparison-info">
                <span class="info-badge"><i class="fas fa-ruler"></i> Dung sai: ±${tolerance}cm (±${toleranceInch}")</span>
                <span class="info-badge"><i class="fas fa-exchange-alt"></i> Đơn vị gốc: ${result.comparison.details[0]?.unit || 'inch'}</span>
            </div>
            <table class="comparison-table">
                <thead>
                    <tr><th>Size</th><th>Chỉ số</th><th>Đọc được</th><th>Chuẩn US</th><th>Chênh lệch</th><th>Kết quả</th></tr>
                </thead>
                <tbody>
                    ${result.comparison.details.map(d => {
                        const keys = Object.keys(d.measurements);
                        return keys.map((key, i) => {
                            const m = d.measurements[key];
                            const label = US_SIZE_STANDARD.measurementLabels[key] || key;
                            return `
                                <tr>
                                    ${i === 0 ? `<td class="size-col" rowspan="${keys.length}">${d.size}</td>` : ''}
                                    <td>${label}</td>
                                    <td><strong>${m.extracted}"</strong></td>
                                    <td>${m.expected}"</td>
                                    <td>${m.diff > 0 ? '+' : ''}${m.diff}"</td>
                                    <td class="${m.isMatch ? 'match-cell' : 'unmatch-cell'}">${m.isMatch ? '✓ OK' : '✗ Lệch'}</td>
                                </tr>
                            `;
                        }).join('');
                    }).join('')}
                </tbody>
            </table>
            <div class="size-summary">
                ${result.comparison.matchedSizes.length > 0 ? `<span class="size-badge match">✓ Match: ${result.comparison.matchedSizes.join(', ')}</span>` : ''}
                ${result.comparison.unmatchedSizes.length > 0 ? `<span class="size-badge unmatch">✗ Unmatch: ${result.comparison.unmatchedSizes.join(', ')}</span>` : ''}
            </div>
        `;
    }

    const html = `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${result.image.src}" class="result-image" alt="Image ${index}">
                    <div class="result-title">
                        <h4>Ảnh #${index}</h4>
                        <small>${result.image.name.substring(0, 35)}${result.image.name.length > 35 ? '...' : ''}</small>
                    </div>
                </div>
                <span class="result-status ${result.status}">${result.status === 'match' ? '✓ MATCH' : '✗ UNMATCH'}</span>
            </div>
            ${tableHtml}
            <details class="extracted-data">
                <summary><i class="fas fa-file-alt"></i> Xem text OCR (Debug)</summary>
                <pre>${escapeHtml(result.text || 'Không có dữ liệu')}</pre>
            </details>
        </div>
    `;
    DOM.resultsContainer.insertAdjacentHTML('beforeend', html);
}

function displayErrorResult(img, index, error) {
    const html = `
        <div class="result-item unmatch">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${img.src}" class="result-image" alt="Image ${index}">
                    <div class="result-title"><h4>Ảnh #${index}</h4><small>${img.name}</small></div>
                </div>
                <span class="result-status unmatch">⚠ LỖI</span>
            </div>
            <div class="no-data-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể xử lý ảnh này</p>
                <small>${error}</small>
            </div>
        </div>
    `;
    DOM.resultsContainer.insertAdjacentHTML('beforeend', html);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== LOADING ====================
function showLoading(text = 'Đang xử lý...') {
    DOM.loadingOverlay.classList.add('active');
    DOM.loadingText.textContent = text;
    DOM.loadingDetail.textContent = '';
    DOM.progress.style.width = '0%';
}

function hideLoading() {
    DOM.loadingOverlay.classList.remove('active');
}

function updateLoadingText(text) {
    DOM.loadingText.textContent = text;
}

function updateLoadingDetail(text) {
    DOM.loadingDetail.textContent = text;
}

function updateProgress(percent) {
    DOM.progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== GLOBAL ====================
window.removeImage = removeImage;
window.clearAllImages = clearAllImages;

console.log('📐 Size Comparison Tool v2.1 loaded successfully!');
