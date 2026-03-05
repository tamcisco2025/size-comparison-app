// ==================== SIZE STANDARDS DATA (Based on WohWooh.com) ====================
const SIZE_STANDARDS = {
    tshirt: {
        name: "T-Shirt",
        measurements: ["length", "width", "sleeve"],
        sizes: {
            "S": { length: 28, width: 18, sleeve: 15.62 },
            "M": { length: 29, width: 20, sleeve: 17 },
            "L": { length: 30, width: 22, sleeve: 18.5 },
            "XL": { length: 31, width: 24, sleeve: 20 },
            "2XL": { length: 32, width: 26, sleeve: 21.97 },
            "3XL": { length: 33, width: 28, sleeve: 22.99 },
            "4XL": { length: 34, width: 30, sleeve: 24.02 },
            "5XL": { length: 35, width: 32, sleeve: 25.04 }
        }
    },
    hoodie: {
        name: "Hoodie",
        measurements: ["length", "width", "sleeve"],
        sizes: {
            "S": { length: 27, width: 20, sleeve: 33.5 },
            "M": { length: 28, width: 21.5, sleeve: 34.5 },
            "L": { length: 29, width: 23, sleeve: 35.5 },
            "XL": { length: 30, width: 25, sleeve: 36.5 },
            "2XL": { length: 31, width: 26.5, sleeve: 37.5 },
            "3XL": { length: 32, width: 28, sleeve: 38.5 },
            "4XL": { length: 33, width: 30, sleeve: 39.5 },
            "5XL": { length: 34, width: 32, sleeve: 40.5 }
        }
    },
    sweatshirt: {
        name: "Sweatshirt",
        measurements: ["length", "width", "sleeve"],
        sizes: {
            "S": { length: 26.5, width: 20, sleeve: 21.5 },
            "M": { length: 27.5, width: 22, sleeve: 22 },
            "L": { length: 28.5, width: 24, sleeve: 22.5 },
            "XL": { length: 29.5, width: 26, sleeve: 23 },
            "2XL": { length: 30.5, width: 28, sleeve: 23.5 },
            "3XL": { length: 31.5, width: 30, sleeve: 24 }
        }
    },
    tanktop: {
        name: "Tank Top",
        measurements: ["length", "width"],
        sizes: {
            "S": { length: 27, width: 18 },
            "M": { length: 28, width: 20 },
            "L": { length: 29, width: 22 },
            "XL": { length: 30, width: 24 },
            "2XL": { length: 31, width: 26 }
        }
    },
    longsleeve: {
        name: "Long Sleeve",
        measurements: ["length", "width", "sleeve"],
        sizes: {
            "S": { length: 28, width: 18, sleeve: 24 },
            "M": { length: 29, width: 20, sleeve: 24.5 },
            "L": { length: 30, width: 22, sleeve: 25 },
            "XL": { length: 31, width: 24, sleeve: 25.5 },
            "2XL": { length: 32, width: 26, sleeve: 26 },
            "3XL": { length: 33, width: 28, sleeve: 26.5 }
        }
    }
};

// ==================== GLOBAL VARIABLES ====================
let uploadedImages = [];
let currentProductType = 'tshirt';
let tolerance = 2; // cm

// ==================== DOM ELEMENTS ====================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    fileInput: $('#file-input'),
    dropzone: $('#dropzone'),
    urlInputsContainer: $('#url-inputs'),
    addUrlBtn: $('#add-url-btn'),
    loadUrlsBtn: $('#load-urls-btn'),
    productTypeSelect: $('#product-type'),
    toleranceInput: $('#tolerance'),
    toleranceInch: $('#tolerance-inch'),
    enhanceImageCheckbox: $('#enhance-image'),
    autoDetectUnitCheckbox: $('#auto-detect-unit'),
    previewGrid: $('#preview-grid'),
    previewSection: $('#preview-section'),
    imageCount: $('#image-count'),
    compareBtn: $('#compare-btn'),
    standardTbody: $('#standard-tbody'),
    tableHeader: $('#table-header'),
    currentProductName: $('#current-product-name'),
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
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initDropzone();
    initUrlInputs();
    initSettings();
    loadStandardTable();
    initCompareButton();
    
    console.log('✅ Size Comparison Tool initialized!');
});

// ==================== TAB FUNCTIONALITY ====================
function initTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            elements.tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ==================== DROPZONE FUNCTIONALITY ====================
function initDropzone() {
    const dropzone = elements.dropzone;
    const fileInput = elements.fileInput;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'));
    });

    dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
    dropzone.addEventListener('click', (e) => {
        if (!e.target.closest('.file-label')) {
            fileInput.click();
        }
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        return ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
    });

    if (validFiles.length === 0) {
        showToast('Vui lòng chọn file PNG hoặc JPEG!', 'warning');
        return;
    }

    if (uploadedImages.length + validFiles.length > 5) {
        showToast('Tối đa 5 ảnh! Đã bỏ qua một số file.', 'warning');
    }

    const remaining = 5 - uploadedImages.length;
    validFiles.slice(0, remaining).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            addImage({
                type: 'file',
                src: e.target.result,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    });
}

// ==================== URL INPUTS FUNCTIONALITY ====================
function initUrlInputs() {
    elements.addUrlBtn.addEventListener('click', addUrlInput);
    elements.loadUrlsBtn.addEventListener('click', loadUrlImages);
    
    elements.urlInputsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-url')) {
            const group = e.target.closest('.url-input-group');
            if (elements.urlInputsContainer.children.length > 1) {
                group.remove();
            } else {
                group.querySelector('.url-input').value = '';
            }
        }
    });
}

function addUrlInput() {
    if (elements.urlInputsContainer.children.length >= 5) {
        showToast('Tối đa 5 URL!', 'warning');
        return;
    }

    const group = document.createElement('div');
    group.className = 'url-input-group';
    group.innerHTML = `
        <input type="text" class="url-input" placeholder="Nhập URL ảnh...">
        <button class="btn-remove-url" title="Xóa"><i class="fas fa-times"></i></button>
    `;
    elements.urlInputsContainer.appendChild(group);
}

async function loadUrlImages() {
    const urlInputs = elements.urlInputsContainer.querySelectorAll('.url-input');
    const urls = Array.from(urlInputs)
        .map(input => input.value.trim())
        .filter(url => url && isValidImageUrl(url));

    if (urls.length === 0) {
        showToast('Vui lòng nhập URL hợp lệ!', 'warning');
        return;
    }

    // Remove existing URL images
    uploadedImages = uploadedImages.filter(img => img.type !== 'url');

    showLoading('Đang tải ảnh từ URL...');
    
    for (let i = 0; i < urls.length && uploadedImages.length < 5; i++) {
        try {
            updateLoadingText(`Đang tải ảnh ${i + 1}/${urls.length}...`);
            
            // For CORS issues, we'll use a proxy or direct loading
            const imgSrc = await loadImageFromUrl(urls[i]);
            
            addImage({
                type: 'url',
                src: imgSrc,
                name: urls[i].split('/').pop() || `URL Image ${i + 1}`,
                originalUrl: urls[i]
            });
        } catch (error) {
            console.error('Failed to load:', urls[i], error);
            showToast(`Không thể tải: ${urls[i].substring(0, 30)}...`, 'error');
        }
    }

    hideLoading();
    showToast(`Đã tải ${uploadedImages.filter(img => img.type === 'url').length} ảnh!`, 'success');
}

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => {
            // Try with proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const proxyImg = new Image();
            proxyImg.crossOrigin = 'Anonymous';
            
            proxyImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = proxyImg.width;
                canvas.height = proxyImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(proxyImg, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            
            proxyImg.onerror = () => reject(new Error('Failed to load image'));
            proxyImg.src = proxyUrl;
        };
        
        img.src = url;
    });
}

function isValidImageUrl(url) {
    try {
        new URL(url);
        return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(url) || 
               url.includes('cjdropshipping.com') ||
               url.includes('alicdn.com') ||
               url.includes('imgur.com');
    } catch {
        return false;
    }
}

// ==================== IMAGE MANAGEMENT ====================
function addImage(imageData) {
    if (uploadedImages.length >= 5) {
        showToast('Đã đạt giới hạn 5 ảnh!', 'warning');
        return;
    }
    
    const isDuplicate = uploadedImages.some(img => 
        img.src === imageData.src || img.originalUrl === imageData.originalUrl
    );
    
    if (!isDuplicate) {
        uploadedImages.push(imageData);
        updatePreview();
        updateCompareButton();
        showToast(`Đã thêm: ${imageData.name}`, 'success');
    }
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updatePreview();
    updateCompareButton();
}

function updatePreview() {
    elements.previewGrid.innerHTML = '';
    elements.imageCount.textContent = uploadedImages.length;
    
    if (uploadedImages.length === 0) {
        elements.previewSection.classList.remove('show');
        return;
    }
    
    elements.previewSection.classList.add('show');
    
    uploadedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${img.src}" alt="${img.name}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
            <button class="remove-btn" onclick="removeImage(${index})" title="Xóa">
                <i class="fas fa-times"></i>
            </button>
            <span class="image-index">#${index + 1}</span>
        `;
        elements.previewGrid.appendChild(item);
    });
}

function updateCompareButton() {
    elements.compareBtn.disabled = uploadedImages.length === 0;
}

// ==================== SETTINGS ====================
function initSettings() {
    elements.productTypeSelect.addEventListener('change', (e) => {
        currentProductType = e.target.value;
        loadStandardTable();
    });

    elements.toleranceInput.addEventListener('input', (e) => {
        tolerance = parseFloat(e.target.value) || 0;
        elements.toleranceInch.textContent = cmToInch(tolerance).toFixed(2);
    });
}

function loadStandardTable() {
    const standard = SIZE_STANDARDS[currentProductType];
    const tbody = elements.standardTbody;
    const header = elements.tableHeader;
    
    // Update product name
    elements.currentProductName.textContent = standard.name;
    
    // Update headers
    const measurementLabels = {
        length: 'Length (inch)',
        width: 'Width (inch)',
        sleeve: 'Sleeve (inch)',
        waist: 'Waist (inch)',
        inseam: 'Inseam (inch)'
    };
    
    header.innerHTML = '<th>Size</th>' + 
        standard.measurements.map(m => `<th>${measurementLabels[m]}</th>`).join('');

    // Update body
    tbody.innerHTML = '';
    Object.entries(standard.sizes).forEach(([size, measurements]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><strong>${size}</strong></td>` +
            standard.measurements.map(m => `<td>${measurements[m]}"</td>`).join('');
        tbody.appendChild(row);
    });
}

// ==================== COMPARE FUNCTIONALITY ====================
function initCompareButton() {
    elements.compareBtn.addEventListener('click', startComparison);
}

async function startComparison() {
    if (uploadedImages.length === 0) {
        showToast('Vui lòng upload ít nhất 1 ảnh!', 'error');
        return;
    }

    showLoading('Khởi tạo OCR engine...');
    elements.resultsContainer.innerHTML = '';
    elements.resultsSummary.innerHTML = '';
    elements.resultsCard.style.display = 'block';

    const results = [];
    const total = uploadedImages.length;
    let matchCount = 0;
    let unmatchCount = 0;

    for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        updateProgress(((i) / total) * 100);
        updateLoadingText(`Đang xử lý ảnh ${i + 1}/${total}...`);
        updateLoadingDetail(img.name);

        try {
            const result = await processImage(img, i + 1, total);
            results.push(result);
            
            if (result.status === 'match') matchCount++;
            else unmatchCount++;
            
            displayResult(result, i + 1);
        } catch (error) {
            console.error('Error processing image:', error);
            unmatchCount++;
            displayErrorResult(img, i + 1, error.message);
        }
    }

    // Display summary
    displaySummary(total, matchCount, unmatchCount);
    
    hideLoading();
    
    if (matchCount === total) {
        showToast(`✅ Tất cả ${total} ảnh đều MATCH!`, 'success');
    } else if (unmatchCount === total) {
        showToast(`❌ Tất cả ${total} ảnh đều UNMATCH!`, 'error');
    } else {
        showToast(`Hoàn tất: ${matchCount} MATCH, ${unmatchCount} UNMATCH`, 'info');
    }
}

async function processImage(imageData, current, total) {
    const shouldEnhance = elements.enhanceImageCheckbox.checked;
    
    // Load and optionally enhance image
    updateLoadingDetail('Đang tải ảnh...');
    const img = await loadImage(imageData.src);
    
    let processedCanvas;
    if (shouldEnhance) {
        updateLoadingDetail('Đang làm rõ ảnh...');
        processedCanvas = enhanceImageQuality(img);
    } else {
        processedCanvas = imageToCanvas(img);
    }
    
    // OCR
    updateLoadingDetail('Đang nhận dạng text (OCR)...');
    const extractedText = await extractTextFromImage(processedCanvas, current, total);
    
    // Parse measurements
    updateLoadingDetail('Đang phân tích kích thước...');
    const measurements = parseMeasurements(extractedText);
    
    // Compare with standards
    const comparison = compareMeasurements(measurements);
    
    return {
        image: imageData,
        extractedText,
        measurements,
        comparison,
        status: comparison.isMatch ? 'match' : 'unmatch'
    };
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Không thể tải ảnh'));
        img.src = src;
    });
}

function imageToCanvas(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
}

function enhanceImageQuality(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale up for better OCR
    const scale = Math.min(3, 2000 / Math.max(img.width, img.height));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Enable image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw scaled image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Increase contrast
        const contrast = 1.5;
        let newGray = ((gray - 128) * contrast) + 128;
        newGray = Math.max(0, Math.min(255, newGray));
        
        // Apply threshold for cleaner text
        const threshold = newGray > 140 ? 255 : 0;
        
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

async function extractTextFromImage(imageSource, current, total) {
    try {
        const result = await Tesseract.recognize(
            imageSource,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        const baseProgress = ((current - 1) / total) * 100;
                        const stepProgress = (info.progress * 100) / total;
                        updateProgress(baseProgress + stepProgress * 0.8);
                    }
                }
            }
        );
        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Lỗi nhận dạng text');
    }
}

function parseMeasurements(text) {
    const measurements = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Detect unit
    const textLower = text.toLowerCase();
    const isCm = textLower.includes('cm') || textLower.includes('centimeter');
    
    // Common size patterns
    const sizePattern = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|\d{1,2})\b/gi;
    
    // Find table-like patterns
    // Pattern 1: "Size L 29 22 8.75" or "L: 29, 22, 8.75"
    const tableRowPattern = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b[\s:,]*(\d+\.?\d*)[\s,]+(\d+\.?\d*)(?:[\s,]+(\d+\.?\d*))?/gi;
    
    let match;
    while ((match = tableRowPattern.exec(text)) !== null) {
        const size = normalizeSize(match[1]);
        const values = [
            parseFloat(match[2]),
            parseFloat(match[3]),
            match[4] ? parseFloat(match[4]) : null
        ].filter(v => v !== null && !isNaN(v));
        
        if (values.length >= 2) {
            const standard = SIZE_STANDARDS[currentProductType];
            const measurementKeys = standard.measurements;
            
            measurements[size] = {
                originalUnit: isCm ? 'cm' : 'inch'
            };
            
            values.forEach((value, idx) => {
                if (measurementKeys[idx]) {
                    // Convert to inch if needed
                    measurements[size][measurementKeys[idx]] = isCm ? cmToInch(value) : value;
                }
            });
        }
    }
    
    // If no structured data found, try to find individual numbers
    if (Object.keys(measurements).length === 0) {
        const allNumbers = text.match(/\d+\.?\d*/g) || [];
        const sizes = text.match(sizePattern) || [];
        
        // Try to match numbers to sizes
        if (sizes.length > 0 && allNumbers.length >= sizes.length * 2) {
            const standard = SIZE_STANDARDS[currentProductType];
            const measurementKeys = standard.measurements;
            
            sizes.forEach((size, idx) => {
                const normalizedSize = normalizeSize(size);
                const startIdx = idx * measurementKeys.length;
                
                measurements[normalizedSize] = {
                    originalUnit: isCm ? 'cm' : 'inch'
                };
                
                measurementKeys.forEach((key, keyIdx) => {
                    const value = parseFloat(allNumbers[startIdx + keyIdx]);
                    if (!isNaN(value)) {
                        measurements[normalizedSize][key] = isCm ? cmToInch(value) : value;
                    }
                });
            });
        }
    }
    
    return measurements;
}

function normalizeSize(size) {
    const s = size.toUpperCase().trim();
    const sizeMap = {
        'XXS': 'XXS',
        'XS': 'XS',
        'S': 'S',
        'M': 'M',
        'L': 'L',
        'XL': 'XL',
        'XXL': '2XL',
        '2XL': '2XL',
        'XXXL': '3XL',
        '3XL': '3XL',
        '4XL': '4XL',
        '5XL': '5XL'
    };
    return sizeMap[s] || s;
}

function cmToInch(cm) {
    return Math.round((cm / 2.54) * 100) / 100;
}

function inchToCm(inch) {
    return Math.round(inch * 2.54 * 100) / 100;
}

function compareMeasurements(extractedMeasurements) {
    const standard = SIZE_STANDARDS[currentProductType];
    const toleranceInch = cmToInch(tolerance);
    
    const comparison = {
        isMatch: true,
        details: [],
        matchedSizes: [],
        unmatchedSizes: [],
        totalChecked: 0
    };

    if (Object.keys(extractedMeasurements).length === 0) {
        comparison.isMatch = false;
        comparison.noData = true;
        return comparison;
    }

    Object.entries(extractedMeasurements).forEach(([size, measurements]) => {
        if (standard.sizes[size]) {
            const standardMeasurements = standard.sizes[size];
            const sizeComparison = {
                size,
                measurements: {},
                isMatch: true,
                originalUnit: measurements.originalUnit
            };

            standard.measurements.forEach(key => {
                if (measurements[key] !== undefined && measurements[key] !== null) {
                    comparison.totalChecked++;
                    const extracted = measurements[key];
                    const standardValue = standardMeasurements[key];
                    const diff = extracted - standardValue;
                    const absDiff = Math.abs(diff);
                    const isWithinTolerance = absDiff <= toleranceInch;

                    sizeComparison.measurements[key] = {
                        extracted: Math.round(extracted * 100) / 100,
                        standard: standardValue,
                        diff: Math.round(diff * 100) / 100,
                        isMatch: isWithinTolerance
                    };

                    if (!isWithinTolerance) {
                        sizeComparison.isMatch = false;
                    }
                }
            });

            if (Object.keys(sizeComparison.measurements).length > 0) {
                if (sizeComparison.isMatch) {
                    comparison.matchedSizes.push(size);
                } else {
                    comparison.unmatchedSizes.push(size);
                    comparison.isMatch = false;
                }
                comparison.details.push(sizeComparison);
            }
        }
    });

    if (comparison.details.length === 0) {
        comparison.isMatch = false;
        comparison.noData = true;
    }

    return comparison;
}

// ==================== DISPLAY RESULTS ====================
function displaySummary(total, matchCount, unmatchCount) {
    elements.resultsSummary.innerHTML = `
        <div class="summary-item total">
            <div class="number">${total}</div>
            <div class="label">Tổng ảnh</div>
        </div>
        <div class="summary-item match">
            <div class="number">${matchCount}</div>
            <div class="label">MATCH ✓</div>
        </div>
        <div class="summary-item unmatch">
            <div class="number">${unmatchCount}</div>
            <div class="label">UNMATCH ✗</div>
        </div>
    `;
}

function displayResult(result, index) {
    const measurementLabels = {
        length: 'Length',
        width: 'Width', 
        sleeve: 'Sleeve',
        waist: 'Waist',
        inseam: 'Inseam'
    };

    let comparisonTableHtml = '';
    
    if (result.comparison.noData) {
        comparisonTableHtml = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể trích xuất dữ liệu size từ ảnh này</p>
                <small>Hãy thử upload ảnh rõ nét hơn hoặc kiểm tra lại định dạng bảng size</small>
            </div>
        `;
    } else if (result.comparison.details.length > 0) {
        const standard = SIZE_STANDARDS[currentProductType];
        
        comparisonTableHtml = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        ${standard.measurements.map(m => `
                            <th>${measurementLabels[m]}<br><small>(Đọc được)</small></th>
                            <th>${measurementLabels[m]}<br><small>(Chuẩn US)</small></th>
                        `).join('')}
                        <th>Kết quả</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.comparison.details.map(detail => `
                        <tr>
                            <td class="size-col">${detail.size}</td>
                            ${standard.measurements.map(m => {
                                const data = detail.measurements[m];
                                if (data) {
                                    return `
                                        <td class="${data.isMatch ? 'match-cell' : 'unmatch-cell'}">
                                            ${data.extracted}"
                                            <br><small>(${data.diff > 0 ? '+' : ''}${data.diff}")</small>
                                        </td>
                                        <td>${data.standard}"</td>
                                    `;
                                }
                                return '<td>-</td><td>-</td>';
                            }).join('')}
                            <td class="${detail.isMatch ? 'match-cell' : 'unmatch-cell'}">
                                ${detail.isMatch ? '✓ OK' : '✗ Lệch'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    const resultHtml = `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${result.image.src}" class="result-image" alt="Image ${index}" 
                         onerror="this.src='https://via.placeholder.com/60?text=Error'">
                    <h4>Ảnh #${index}: ${result.image.name.substring(0, 30)}${result.image.name.length > 30 ? '...' : ''}</h4>
                </div>
                <span class="result-status ${result.status}">
                    ${result.status === 'match' ? '✓ MATCH' : '✗ UNMATCH'}
                </span>
            </div>
            
            ${comparisonTableHtml}
            
            <details class="extracted-data">
                <summary><i class="fas fa-file-alt"></i> Xem text đọc được từ ảnh</summary>
                <pre>${result.extractedText || 'Không đọc được text'}</pre>
            </details>
        </div>
    `;

    elements.resultsContainer.insertAdjacentHTML('beforeend', resultHtml);
}

function displayErrorResult(imageData, index, errorMessage) {
    const resultHtml = `
        <div class="result-item unmatch">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${imageData.src}" class="result-image" alt="Image ${index}" 
                         onerror="this.src='https://via.placeholder.com/60?text=Error'">
                    <h4>Ảnh #${index}: ${imageData.name}</h4>
                </div>
                <span class="result-status unmatch">LỖI</span>
            </div>
            <div class="no-data-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${errorMessage}</p>
            </div>
        </div>
    `;
    elements.resultsContainer.insertAdjacentHTML('beforeend', resultHtml);
}

// ==================== LOADING FUNCTIONS ====================
function showLoading(text = 'Đang xử lý...') {
    elements.loadingOverlay.classList.add('active');
    elements.loadingText.textContent = text;
    elements.loadingDetail.textContent = '';
    elements.progress.style.width = '0%';
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

function updateLoadingText(text) {
    elements.loadingText.textContent = text;
}

function updateLoadingDetail(text) {
    elements.loadingDetail.textContent = text;
}

function updateProgress(percent) {
    elements.progress.style.width = `${Math.min(100, percent)}%`;
}

// ==================== TOAST NOTIFICATIONS ====================
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
    
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions globally accessible
window.removeImage = removeImage;
