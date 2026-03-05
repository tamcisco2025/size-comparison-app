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
let isProcessing = false;

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
    
    console.log('✅ Size Comparison Tool v2.0 initialized!');
    showToast('Sẵn sàng! Upload tối đa 5 ảnh để so sánh.', 'info');
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

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    });
    
    dropzone.addEventListener('click', (e) => {
        if (!e.target.closest('.file-label')) {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
            // Reset input để có thể chọn lại cùng file
            e.target.value = '';
        }
    });
}

// ==================== FIX: Handle Multiple Files ====================
async function handleFiles(files) {
    const fileArray = Array.from(files);
    
    // Filter valid image files
    const validFiles = fileArray.filter(file => {
        const isValid = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
        if (!isValid) {
            console.log(`Skipped invalid file: ${file.name} (${file.type})`);
        }
        return isValid;
    });

    if (validFiles.length === 0) {
        showToast('Vui lòng chọn file PNG hoặc JPEG!', 'warning');
        return;
    }

    // Check remaining slots
    const remainingSlots = 5 - uploadedImages.length;
    
    if (remainingSlots <= 0) {
        showToast('Đã đạt giới hạn 5 ảnh! Hãy xóa bớt ảnh cũ.', 'warning');
        return;
    }

    const filesToProcess = validFiles.slice(0, remainingSlots);
    
    if (validFiles.length > remainingSlots) {
        showToast(`Chỉ thêm được ${remainingSlots} ảnh nữa. Đã bỏ qua ${validFiles.length - remainingSlots} file.`, 'warning');
    }

    console.log(`Processing ${filesToProcess.length} files...`);

    // Process all files and wait for completion
    const promises = filesToProcess.map((file, index) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                console.log(`✅ Loaded file ${index + 1}: ${file.name}`);
                resolve({
                    type: 'file',
                    src: e.target.result,
                    name: file.name,
                    size: file.size,
                    id: Date.now() + index + Math.random() // Unique ID
                });
            };
            
            reader.onerror = (error) => {
                console.error(`❌ Error loading file ${file.name}:`, error);
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    });

    try {
        // Wait for all files to be loaded
        const loadedImages = await Promise.all(promises);
        
        // Add all images to the array
        loadedImages.forEach(imageData => {
            // Check for duplicates
            const isDuplicate = uploadedImages.some(img => 
                img.name === imageData.name && img.size === imageData.size
            );
            
            if (!isDuplicate) {
                uploadedImages.push(imageData);
                console.log(`Added: ${imageData.name}, Total: ${uploadedImages.length}`);
            } else {
                console.log(`Skipped duplicate: ${imageData.name}`);
            }
        });
        
        // Update UI after all images are added
        updatePreview();
        updateCompareButton();
        
        showToast(`Đã thêm ${loadedImages.length} ảnh! (${uploadedImages.length}/5)`, 'success');
        
    } catch (error) {
        console.error('Error processing files:', error);
        showToast('Có lỗi khi đọc file!', 'error');
    }
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
    const currentCount = elements.urlInputsContainer.children.length;
    if (currentCount >= 5) {
        showToast('Tối đa 5 URL!', 'warning');
        return;
    }

    const group = document.createElement('div');
    group.className = 'url-input-group';
    group.innerHTML = `
        <input type="text" class="url-input" placeholder="Nhập URL ảnh ${currentCount + 1}...">
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

    // Check remaining slots
    const remainingSlots = 5 - uploadedImages.length;
    if (remainingSlots <= 0) {
        showToast('Đã đạt giới hạn 5 ảnh!', 'warning');
        return;
    }

    const urlsToLoad = urls.slice(0, remainingSlots);
    
    showLoading('Đang tải ảnh từ URL...');
    let successCount = 0;
    
    for (let i = 0; i < urlsToLoad.length; i++) {
        try {
            updateLoadingText(`Đang tải ảnh ${i + 1}/${urlsToLoad.length}...`);
            updateProgress((i / urlsToLoad.length) * 100);
            
            const imgSrc = await loadImageFromUrl(urlsToLoad[i]);
            
            const imageData = {
                type: 'url',
                src: imgSrc,
                name: urlsToLoad[i].split('/').pop() || `URL_Image_${i + 1}`,
                originalUrl: urlsToLoad[i],
                id: Date.now() + i + Math.random()
            };
            
            uploadedImages.push(imageData);
            successCount++;
            
        } catch (error) {
            console.error('Failed to load:', urlsToLoad[i], error);
            showToast(`Không thể tải: ${urlsToLoad[i].substring(0, 30)}...`, 'error');
        }
    }

    hideLoading();
    updatePreview();
    updateCompareButton();
    
    if (successCount > 0) {
        showToast(`Đã tải ${successCount} ảnh! (${uploadedImages.length}/5)`, 'success');
    }
}

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        // Try direct load first
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeout = setTimeout(() => {
            reject(new Error('Timeout loading image'));
        }, 15000);
        
        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                // Try with proxy if direct fails
                loadWithProxy(url).then(resolve).catch(reject);
            }
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            // Try with proxy
            loadWithProxy(url).then(resolve).catch(reject);
        };
        
        img.src = url;
    });
}

function loadWithProxy(url) {
    return new Promise((resolve, reject) => {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
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
        
        img.onerror = () => reject(new Error('Failed to load with proxy'));
        img.src = proxyUrl;
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
function removeImage(index) {
    if (index >= 0 && index < uploadedImages.length) {
        const removed = uploadedImages.splice(index, 1);
        console.log(`Removed image: ${removed[0]?.name}, Remaining: ${uploadedImages.length}`);
        updatePreview();
        updateCompareButton();
        showToast('Đã xóa ảnh!', 'info');
    }
}

function clearAllImages() {
    uploadedImages = [];
    updatePreview();
    updateCompareButton();
    showToast('Đã xóa tất cả ảnh!', 'info');
}

function updatePreview() {
    const grid = elements.previewGrid;
    const section = elements.previewSection;
    const countEl = elements.imageCount;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Update count
    countEl.textContent = uploadedImages.length;
    
    console.log(`Updating preview: ${uploadedImages.length} images`);
    
    if (uploadedImages.length === 0) {
        section.classList.remove('show');
        section.style.display = 'none';
        return;
    }
    
    // Show section
    section.classList.add('show');
    section.style.display = 'block';
    
    // Create preview items
    uploadedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.index = index;
        
        item.innerHTML = `
            <img src="${img.src}" alt="${img.name}" 
                 onerror="this.src='https://via.placeholder.com/100x100?text=Error'">
            <button class="remove-btn" onclick="removeImage(${index})" title="Xóa ảnh này">
                <i class="fas fa-times"></i>
            </button>
            <span class="image-index">#${index + 1}</span>
        `;
        
        grid.appendChild(item);
    });
    
    console.log(`Preview updated: ${grid.children.length} items shown`);
}

function updateCompareButton() {
    const btn = elements.compareBtn;
    const hasImages = uploadedImages.length > 0;
    
    btn.disabled = !hasImages || isProcessing;
    
    if (hasImages) {
        btn.innerHTML = `<i class="fas fa-balance-scale"></i> So Sánh ${uploadedImages.length} Ảnh`;
    } else {
        btn.innerHTML = `<i class="fas fa-balance-scale"></i> So Sánh Kích Thước`;
    }
}

// ==================== SETTINGS ====================
function initSettings() {
    elements.productTypeSelect.addEventListener('change', (e) => {
        currentProductType = e.target.value;
        loadStandardTable();
        showToast(`Đã chọn: ${SIZE_STANDARDS[currentProductType].name}`, 'info');
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
    
    elements.currentProductName.textContent = standard.name;
    
    const measurementLabels = {
        length: 'Length (inch)',
        width: 'Width (inch)',
        sleeve: 'Sleeve (inch)',
        waist: 'Waist (inch)',
        inseam: 'Inseam (inch)'
    };
    
    header.innerHTML = '<th>Size</th>' + 
        standard.measurements.map(m => `<th>${measurementLabels[m]}</th>`).join('');

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

    if (isProcessing) {
        showToast('Đang xử lý, vui lòng đợi...', 'warning');
        return;
    }

    isProcessing = true;
    updateCompareButton();
    
    showLoading('Đang khởi tạo OCR engine...');
    
    // Clear previous results
    elements.resultsContainer.innerHTML = '';
    elements.resultsSummary.innerHTML = '';
    elements.resultsCard.style.display = 'block';

    const results = [];
    const total = uploadedImages.length;
    let matchCount = 0;
    let unmatchCount = 0;

    console.log(`\n========== Starting comparison for ${total} images ==========\n`);

    for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        const imageNum = i + 1;
        
        console.log(`\n----- Processing Image ${imageNum}/${total}: ${img.name} -----`);
        
        updateProgress((i / total) * 100);
        updateLoadingText(`Đang xử lý ảnh ${imageNum}/${total}...`);
        updateLoadingDetail(img.name);

        try {
            const result = await processImage(img, imageNum, total);
            results.push(result);
            
            if (result.status === 'match') {
                matchCount++;
                console.log(`✅ Image ${imageNum}: MATCH`);
            } else {
                unmatchCount++;
                console.log(`❌ Image ${imageNum}: UNMATCH`);
            }
            
            // Display result immediately
            displayResult(result, imageNum);
            
        } catch (error) {
            console.error(`❌ Error processing image ${imageNum}:`, error);
            unmatchCount++;
            
            const errorResult = {
                image: img,
                status: 'error',
                error: error.message
            };
            results.push(errorResult);
            displayErrorResult(img, imageNum, error.message);
        }
        
        // Update progress
        updateProgress(((i + 1) / total) * 100);
    }

    console.log(`\n========== Comparison Complete ==========`);
    console.log(`Total: ${total}, Match: ${matchCount}, Unmatch: ${unmatchCount}`);

    // Display summary
    displaySummary(total, matchCount, unmatchCount);
    
    hideLoading();
    isProcessing = false;
    updateCompareButton();
    
    // Show final toast
    if (matchCount === total) {
        showToast(`✅ Tuyệt vời! Tất cả ${total} ảnh đều MATCH!`, 'success');
    } else if (unmatchCount === total) {
        showToast(`❌ Tất cả ${total} ảnh đều UNMATCH!`, 'error');
    } else {
        showToast(`Hoàn tất: ${matchCount} MATCH, ${unmatchCount} UNMATCH`, 'info');
    }
}

async function processImage(imageData, current, total) {
    const shouldEnhance = elements.enhanceImageCheckbox.checked;
    
    // Step 1: Load image
    updateLoadingDetail('Đang tải ảnh...');
    const img = await loadImage(imageData.src);
    console.log(`Image loaded: ${img.width}x${img.height}`);
    
    // Step 2: Enhance image for better OCR
    let processedCanvas;
    if (shouldEnhance) {
        updateLoadingDetail('Đang làm rõ ảnh để tăng độ chính xác...');
        processedCanvas = enhanceImageForOCR(img);
    } else {
        processedCanvas = imageToCanvas(img);
    }
    
    // Step 3: OCR with high accuracy settings
    updateLoadingDetail('Đang nhận dạng text (OCR) - Chế độ chính xác cao...');
    const extractedText = await extractTextWithHighAccuracy(processedCanvas, current, total);
    console.log('Extracted text:', extractedText.substring(0, 200) + '...');
    
    // Step 4: Parse measurements with multiple patterns
    updateLoadingDetail('Đang phân tích và trích xuất kích thước...');
    const measurements = parseMeasurementsAdvanced(extractedText);
    console.log('Parsed measurements:', measurements);
    
    // Step 5: Compare with standards
    updateLoadingDetail('Đang so sánh với tiêu chuẩn US Size...');
    const comparison = compareMeasurements(measurements);
    
    return {
        image: imageData,
        extractedText,
        measurements,
        comparison,
        status: comparison.isMatch ? 'match' : 'unmatch',
        confidence: comparison.confidence || 0
    };
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeout = setTimeout(() => {
            reject(new Error('Timeout loading image'));
        }, 30000);
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Không thể tải ảnh'));
        };
        
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

// ==================== ENHANCED IMAGE PROCESSING FOR ACCURATE OCR ====================
function enhanceImageForOCR(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale up for better OCR (optimal is around 300 DPI)
    const targetWidth = Math.max(img.width, 1500);
    const scale = targetWidth / img.width;
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Step 1: Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
    
    // Step 2: Increase contrast (adaptive)
    const contrast = 1.8;
    for (let i = 0; i < data.length; i += 4) {
        let val = data[i];
        val = ((val - 128) * contrast) + 128;
        val = Math.max(0, Math.min(255, val));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    
    // Step 3: Binarization (Otsu's method approximation)
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
        histogram[Math.floor(data[i])]++;
    }
    
    // Find optimal threshold
    const total = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 128;
    
    for (let i = 0; i < 256; i++) {
        wB += histogram[i];
        if (wB === 0) continue;
        
        wF = total - wB;
        if (wF === 0) break;
        
        sumB += i * histogram[i];
        
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        
        const variance = wB * wF * (mB - mF) * (mB - mF);
        
        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = i;
        }
    }
    
    // Apply threshold
    for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    console.log(`Image enhanced: ${canvas.width}x${canvas.height}, threshold: ${threshold}`);
    
    return canvas;
}

// ==================== HIGH ACCURACY OCR ====================
async function extractTextWithHighAccuracy(imageSource, current, total) {
    try {
        // Initialize Tesseract with optimal settings for size charts
        const result = await Tesseract.recognize(
            imageSource,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        const baseProgress = ((current - 1) / total) * 100;
                        const stepProgress = (info.progress * 80) / total;
                        updateProgress(baseProgress + stepProgress);
                    }
                },
                // Tesseract parameters for better accuracy
                tessedit_char_whitelist: '0123456789.,-/SMLXsmlx ',
                tessedit_pageseg_mode: '6', // Assume uniform block of text
                preserve_interword_spaces: '1'
            }
        );
        
        const text = result.data.text;
        const confidence = result.data.confidence;
        
        console.log(`OCR confidence: ${confidence}%`);
        
        return text;
        
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Lỗi nhận dạng text: ' + error.message);
    }
}

// ==================== ADVANCED MEASUREMENT PARSING ====================
function parseMeasurementsAdvanced(text) {
    const measurements = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    console.log('Parsing text lines:', lines.length);
    
    // Detect unit (cm or inch)
    const textLower = text.toLowerCase();
    const isCm = textLower.includes('cm') || 
                 textLower.includes('centimeter') ||
                 textLower.includes('厘米');
    
    const unit = isCm ? 'cm' : 'inch';
    console.log('Detected unit:', unit);
    
    // Multiple parsing strategies
    
    // Strategy 1: Table row pattern - "S 27 18 8.25" or "S: 27, 18, 8.25"
    const tablePatterns = [
        // Pattern: Size followed by 2-4 numbers
        /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b[\s:,.\-\/]*(\d+\.?\d*)[\s,.\-\/]+(\d+\.?\d*)(?:[\s,.\-\/]+(\d+\.?\d*))?(?:[\s,.\-\/]+(\d+\.?\d*))?/gi,
        // Pattern with size at end
        /(\d+\.?\d*)[\s,.\-\/]+(\d+\.?\d*)(?:[\s,.\-\/]+(\d+\.?\d*))?[\s,.\-\/]*(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/gi
    ];
    
    // Try first pattern
    let match;
    const pattern1 = tablePatterns[0];
    
    while ((match = pattern1.exec(text)) !== null) {
        const size = normalizeSize(match[1]);
        const values = [match[2], match[3], match[4], match[5]]
            .filter(v => v !== undefined)
            .map(v => parseFloat(v))
            .filter(v => !isNaN(v) && v > 0 && v < 100);
        
        if (values.length >= 2) {
            const standard = SIZE_STANDARDS[currentProductType];
            const measurementKeys = standard.measurements;
            
            measurements[size] = {
                originalUnit: unit,
                rawValues: values
            };
            
            values.forEach((value, idx) => {
                if (measurementKeys[idx]) {
                    // Convert to inch if needed
                    const inchValue = isCm ? cmToInch(value) : value;
                    measurements[size][measurementKeys[idx]] = Math.round(inchValue * 100) / 100;
                }
            });
            
            console.log(`Found size ${size}:`, measurements[size]);
        }
    }
    
    // Strategy 2: If no structured data found, look for labeled values
    if (Object.keys(measurements).length === 0) {
        const labelPatterns = {
            length: /(?:length|len|chiều\s*dài|dài)[:\s]*(\d+\.?\d*)/gi,
            width: /(?:width|wid|chest|chiều\s*rộng|rộng|ngực)[:\s]*(\d+\.?\d*)/gi,
            sleeve: /(?:sleeve|tay|tay\s*áo)[:\s]*(\d+\.?\d*)/gi
        };
        
        // Find all sizes mentioned
        const sizeMatches = text.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/gi) || [];
        const uniqueSizes = [...new Set(sizeMatches.map(s => normalizeSize(s)))];
        
        if (uniqueSizes.length > 0) {
            // Try to extract values for each measurement type
            const extractedValues = {};
            
            Object.keys(labelPatterns).forEach(key => {
                const pattern = labelPatterns[key];
                let m;
                const values = [];
                while ((m = pattern.exec(text)) !== null) {
                    values.push(parseFloat(m[1]));
                }
                if (values.length > 0) {
                    extractedValues[key] = values;
                }
            });
            
            console.log('Extracted labeled values:', extractedValues);
        }
    }
    
    // Strategy 3: Extract all numbers and try to match by position
    if (Object.keys(measurements).length === 0) {
        console.log('Trying fallback number extraction...');
        
        const allNumbers = text.match(/\d+\.?\d*/g)?.map(n => parseFloat(n)).filter(n => n > 10 && n < 100) || [];
        const sizes = text.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/gi) || [];
        
        const uniqueSizes = [...new Set(sizes.map(s => normalizeSize(s)))];
        const standard = SIZE_STANDARDS[currentProductType];
        const numMeasurements = standard.measurements.length;
        
        if (uniqueSizes.length > 0 && allNumbers.length >= uniqueSizes.length * numMeasurements) {
            uniqueSizes.forEach((size, idx) => {
                const startIdx = idx * numMeasurements;
                
                measurements[size] = {
                    originalUnit: unit
                };
                
                standard.measurements.forEach((key, keyIdx) => {
                    const value = allNumbers[startIdx + keyIdx];
                    if (value !== undefined) {
                        const inchValue = isCm ? cmToInch(value) : value;
                        measurements[size][key] = Math.round(inchValue * 100) / 100;
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
    return cm / 2.54;
}

function inchToCm(inch) {
    return inch * 2.54;
}

// ==================== COMPARISON WITH TOLERANCE ====================
function compareMeasurements(extractedMeasurements) {
    const standard = SIZE_STANDARDS[currentProductType];
    const toleranceInch = cmToInch(tolerance);
    
    const comparison = {
        isMatch: true,
        details: [],
        matchedSizes: [],
        unmatchedSizes: [],
        totalChecked: 0,
        totalMatched: 0,
        confidence: 0
    };

    // Check if we have any data
    if (Object.keys(extractedMeasurements).length === 0) {
        comparison.isMatch = false;
        comparison.noData = true;
        comparison.confidence = 0;
        return comparison;
    }

    let totalComparisons = 0;
    let matchedComparisons = 0;

    Object.entries(extractedMeasurements).forEach(([size, measurements]) => {
        // Check if this size exists in standard
        if (!standard.sizes[size]) {
            console.log(`Size ${size} not found in standards`);
            return;
        }

        const standardMeasurements = standard.sizes[size];
        const sizeComparison = {
            size,
            measurements: {},
            isMatch: true,
            originalUnit: measurements.originalUnit
        };

        let sizeMatched = true;

        standard.measurements.forEach(key => {
            const extracted = measurements[key];
            const standardValue = standardMeasurements[key];
            
            if (extracted !== undefined && extracted !== null && standardValue !== undefined) {
                totalComparisons++;
                comparison.totalChecked++;
                
                const diff = extracted - standardValue;
                const absDiff = Math.abs(diff);
                const isWithinTolerance = absDiff <= toleranceInch;
                
                if (isWithinTolerance) {
                    matchedComparisons++;
                    comparison.totalMatched++;
                }

                sizeComparison.measurements[key] = {
                    extracted: Math.round(extracted * 100) / 100,
                    standard: standardValue,
                    diff: Math.round(diff * 100) / 100,
                    absDiff: Math.round(absDiff * 100) / 100,
                    tolerance: Math.round(toleranceInch * 100) / 100,
                    isMatch: isWithinTolerance,
                    status: isWithinTolerance ? 'OK' : (diff > 0 ? 'Lớn hơn' : 'Nhỏ hơn')
                };

                if (!isWithinTolerance) {
                    sizeMatched = false;
                }
            }
        });

        if (Object.keys(sizeComparison.measurements).length > 0) {
            sizeComparison.isMatch = sizeMatched;
            
            if (sizeMatched) {
                comparison.matchedSizes.push(size);
            } else {
                comparison.unmatchedSizes.push(size);
                comparison.isMatch = false;
            }
            
            comparison.details.push(sizeComparison);
        }
    });

    // Calculate confidence
    if (totalComparisons > 0) {
        comparison.confidence = Math.round((matchedComparisons / totalComparisons) * 100);
    }

    // Final determination
    if (comparison.details.length === 0) {
        comparison.isMatch = false;
        comparison.noData = true;
    }

    console.log('Comparison result:', {
        isMatch: comparison.isMatch,
        matchedSizes: comparison.matchedSizes,
        unmatchedSizes: comparison.unmatchedSizes,
        confidence: comparison.confidence + '%'
    });

    return comparison;
}

// ==================== DISPLAY RESULTS ====================
function displaySummary(total, matchCount, unmatchCount) {
    const matchPercent = Math.round((matchCount / total) * 100);
    
    elements.resultsSummary.innerHTML = `
        <div class="summary-item total">
            <div class="number">${total}</div>
            <div class="label">Tổng ảnh</div>
        </div>
        <div class="summary-item match">
            <div class="number">${matchCount}</div>
            <div class="label">✓ MATCH</div>
        </div>
        <div class="summary-item unmatch">
            <div class="number">${unmatchCount}</div>
            <div class="label">✗ UNMATCH</div>
        </div>
        <div class="summary-item ${matchPercent >= 80 ? 'match' : matchPercent >= 50 ? 'total' : 'unmatch'}">
            <div class="number">${matchPercent}%</div>
            <div class="label">Tỷ lệ khớp</div>
        </div>
    `;
}

function displayResult(result, index) {
    const measurementLabels = {
        length: 'Dài (Length)',
        width: 'Rộng (Width)', 
        sleeve: 'Tay (Sleeve)',
        waist: 'Eo (Waist)',
        inseam: 'Dài trong (Inseam)'
    };

    let comparisonTableHtml = '';
    
    if (result.comparison.noData) {
        comparisonTableHtml = `
            <div class="no-data-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p><strong>Không thể trích xuất dữ liệu size từ ảnh này</strong></p>
                <small>
                    Có thể do:<br>
                    • Ảnh không đủ rõ nét<br>
                    • Định dạng bảng size không được hỗ trợ<br>
                    • Text trong ảnh bị che khuất hoặc biến dạng
                </small>
            </div>
        `;
    } else if (result.comparison.details.length > 0) {
        const standard = SIZE_STANDARDS[currentProductType];
        const toleranceInch = cmToInch(tolerance);
        
        comparisonTableHtml = `
            <div class="comparison-info">
                <span class="info-badge">
                    <i class="fas fa-ruler"></i> 
                    Dung sai: ±${tolerance}cm (±${toleranceInch.toFixed(2)}")
                </span>
                <span class="info-badge">
                    <i class="fas fa-percentage"></i>
                    Độ tin cậy: ${result.comparison.confidence}%
                </span>
                <span class="info-badge">
                    <i class="fas fa-exchange-alt"></i>
                    Đơn vị gốc: ${result.comparison.details[0]?.originalUnit || 'inch'}
                </span>
            </div>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Chỉ số</th>
                        <th>Đọc được</th>
                        <th>Chuẩn US</th>
                        <th>Chênh lệch</th>
                        <th>Kết quả</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.comparison.details.map(detail => 
                        standard.measurements.map((m, idx) => {
                            const data = detail.measurements[m];
                            if (data) {
                                return `
                                    <tr>
                                        ${idx === 0 ? `<td class="size-col" rowspan="${Object.keys(detail.measurements).length}">${detail.size}</td>` : ''}
                                        <td>${measurementLabels[m]}</td>
                                        <td><strong>${data.extracted}"</strong></td>
                                        <td>${data.standard}"</td>
                                        <td class="${data.isMatch ? '' : 'diff-highlight'}">
                                            ${data.diff > 0 ? '+' : ''}${data.diff}"
                                        </td>
                                        <td class="${data.isMatch ? 'match-cell' : 'unmatch-cell'}">
                                            ${data.isMatch ? '✓ OK' : '✗ ' + data.status}
                                        </td>
                                    </tr>
                                `;
                            }
                            return '';
                        }).join('')
                    ).join('')}
                </tbody>
            </table>
            <div class="size-summary">
                ${result.comparison.matchedSizes.length > 0 ? 
                    `<span class="size-badge match">✓ Match: ${result.comparison.matchedSizes.join(', ')}</span>` : ''}
                ${result.comparison.unmatchedSizes.length > 0 ? 
                    `<span class="size-badge unmatch">✗ Unmatch: ${result.comparison.unmatchedSizes.join(', ')}</span>` : ''}
            </div>
        `;
    }

    const resultHtml = `
        <div class="result-item ${result.status}" data-index="${index}">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${result.image.src}" class="result-image" alt="Image ${index}" 
                         onerror="this.src='https://via.placeholder.com/60x60?text=Error'">
                    <div class="result-title">
                        <h4>Ảnh #${index}</h4>
                        <small>${result.image.name.substring(0, 40)}${result.image.name.length > 40 ? '...' : ''}</small>
                    </div>
                </div>
                <span class="result-status ${result.status}">
                    ${result.status === 'match' ? '✓ MATCH' : result.status === 'error' ? '⚠ LỖI' : '✗ UNMATCH'}
                </span>
            </div>
            
            ${comparisonTableHtml}
            
            <details class="extracted-data">
                <summary>
                    <i class="fas fa-file-alt"></i> 
                    Xem text đọc được từ ảnh (Debug)
                </summary>
                <pre>${escapeHtml(result.extractedText || 'Không đọc được text')}</pre>
            </details>
        </div>
    `;

    elements.resultsContainer.insertAdjacentHTML('beforeend', resultHtml);
    
    // Scroll to new result
    const newResult = elements.resultsContainer.lastElementChild;
    newResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayErrorResult(imageData, index, errorMessage) {
    const resultHtml = `
        <div class="result-item error" data-index="${index}">
            <div class="result-header">
                <div class="result-header-left">
                    <img src="${imageData.src}" class="result-image" alt="Image ${index}" 
                         onerror="this.src='https://via.placeholder.com/60x60?text=Error'">
                    <div class="result-title">
                        <h4>Ảnh #${index}</h4>
                        <small>${imageData.name}</small>
                    </div>
                </div>
                <span class="result-status unmatch">⚠ LỖI</span>
            </div>
            <div class="no-data-message">
                <i class="fas fa-exclamation-circle"></i>
                <p><strong>Không thể xử lý ảnh này</strong></p>
                <small>${errorMessage}</small>
            </div>
        </div>
    `;
    elements.resultsContainer.insertAdjacentHTML('beforeend', resultHtml);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    elements.progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
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

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ==================== MAKE FUNCTIONS GLOBAL ====================
window.removeImage = removeImage;
window.clearAllImages = clearAllImages;

// ==================== ADDITIONAL CSS FOR NEW FEATURES ====================
// Add these styles dynamically
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .comparison-info {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    
    .info-badge {
        background: #e0e7ff;
        color: #4338ca;
        padding: 5px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    
    .size-summary {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .size-badge {
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    
    .size-badge.match {
        background: #d1fae5;
        color: #059669;
    }
    
    .size-badge.unmatch {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .diff-highlight {
        background: #fef3c7 !important;
        font-weight: 600;
    }
    
    .result-title {
        display: flex;
        flex-direction: column;
    }
    
    .result-title h4 {
        margin: 0;
        font-size: 1rem;
    }
    
    .result-title small {
        color: #6b7280;
        font-size: 0.75rem;
        margin-top: 2px;
    }
    
    .result-item.error {
        border-left: 4px solid #f59e0b;
    }
    
    .comparison-table tbody tr:hover {
        background: #f9fafb;
    }
`;
document.head.appendChild(additionalStyles);

console.log('✅ Size Comparison Tool v2.0 - Fixed multiple upload & enhanced accuracy');
