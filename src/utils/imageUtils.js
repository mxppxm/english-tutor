// 图片预处理工具函数
// 针对OCR优化：黑白化、对比度增强、尺寸调整

/**
 * 验证上传的图片文件
 */
export const validateImageFile = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type.toLowerCase())) {
        return {
            valid: false,
            error: '请选择 JPG、PNG 或 WebP 格式的图片'
        }
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: '图片大小不能超过 10MB，请选择更小的图片'
        }
    }

    return { valid: true }
}

/**
 * 将图片文件转换为Canvas对象
 */
const fileToCanvas = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            resolve({ canvas, ctx, originalWidth: img.width, originalHeight: img.height })
        }

        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * 调整图片尺寸（保持清晰度的前提下优化大小）
 */
const resizeForOCR = (canvas, ctx, originalWidth, originalHeight) => {
    // OCR最佳分辨率：不超过2048px，但要保证文字清晰
    const maxDimension = 2048
    const minDimension = 800 // 太小会影响识别

    let newWidth = originalWidth
    let newHeight = originalHeight

    // 如果图片太大，按比例缩小
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
        const ratio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight)
        newWidth = Math.round(originalWidth * ratio)
        newHeight = Math.round(originalHeight * ratio)
    }

    // 如果图片太小，适当放大（但不超过原尺寸的2倍）
    if (originalWidth < minDimension && originalHeight < minDimension) {
        const ratio = Math.min(
            minDimension / originalWidth,
            minDimension / originalHeight,
            2 // 最多放大2倍
        )
        newWidth = Math.round(originalWidth * ratio)
        newHeight = Math.round(originalHeight * ratio)
    }

    // 如果需要调整尺寸
    if (newWidth !== originalWidth || newHeight !== originalHeight) {
        // 创建新的canvas用于缩放
        const resizedCanvas = document.createElement('canvas')
        const resizedCtx = resizedCanvas.getContext('2d')

        resizedCanvas.width = newWidth
        resizedCanvas.height = newHeight

        // 使用高质量的图像缩放
        resizedCtx.imageSmoothingEnabled = true
        resizedCtx.imageSmoothingQuality = 'high'
        resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight)

        return {
            canvas: resizedCanvas,
            ctx: resizedCtx,
            width: newWidth,
            height: newHeight,
            wasResized: true
        }
    }

    return {
        canvas,
        ctx,
        width: originalWidth,
        height: originalHeight,
        wasResized: false
    }
}

/**
 * 转换为灰度图像
 */
const convertToGrayscale = (canvas, ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 转换为灰度
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i]
        const green = data[i + 1]
        const blue = data[i + 2]

        // 使用加权平均法转换为灰度（更接近人眼感知）
        const gray = Math.round(0.299 * red + 0.587 * green + 0.114 * blue)

        data[i] = gray     // R
        data[i + 1] = gray // G
        data[i + 2] = gray // B
        // data[i + 3] 是 alpha，保持不变
    }

    ctx.putImageData(imageData, 0, 0)
    return { canvas, ctx }
}

/**
 * 增强对比度
 */
const enhanceContrast = (canvas, ctx, width, height, factor = 1.5) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 对比度增强公式: newValue = (oldValue - 128) * factor + 128
    for (let i = 0; i < data.length; i += 4) {
        // 只处理RGB，跳过Alpha通道
        for (let j = 0; j < 3; j++) {
            let value = data[i + j]
            value = (value - 128) * factor + 128

            // 确保值在0-255范围内
            data[i + j] = Math.max(0, Math.min(255, Math.round(value)))
        }
    }

    ctx.putImageData(imageData, 0, 0)
    return { canvas, ctx }
}

/**
 * 锐化图像（增强文字边缘）
 */
const sharpenImage = (canvas, ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const output = new Uint8ClampedArray(data)

    // 3x3 锐化卷积核
    const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ]

    const kernelSize = 3
    const half = Math.floor(kernelSize / 2)

    for (let y = half; y < height - half; y++) {
        for (let x = half; x < width - half; x++) {
            for (let c = 0; c < 3; c++) { // RGB通道
                let sum = 0

                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const py = y + ky - half
                        const px = x + kx - half
                        const idx = (py * width + px) * 4 + c
                        sum += data[idx] * kernel[ky * kernelSize + kx]
                    }
                }

                const outputIdx = (y * width + x) * 4 + c
                output[outputIdx] = Math.max(0, Math.min(255, sum))
            }
        }
    }

    const newImageData = new ImageData(output, width, height)
    ctx.putImageData(newImageData, 0, 0)
    return { canvas, ctx }
}

/**
 * 图片预处理主函数
 * @param {File} file - 上传的图片文件
 * @param {Object} options - 处理选项
 * @returns {Promise<Object>} 处理结果
 */
export const preprocessImageForOCR = async (file, options = {}) => {
    const {
        enhanceContrast: doEnhanceContrast = true,
        contrastFactor = 1.3,
        convertToGray = true,
        sharpen = false, // 锐化可能会引入噪点，默认关闭
        quality = 0.95
    } = options

    try {
        console.log('🖼️ 开始图片预处理...')
        const startTime = Date.now()

        // 1. 加载图片到Canvas
        const { canvas, ctx, originalWidth, originalHeight } = await fileToCanvas(file)
        console.log(`📐 原图尺寸: ${originalWidth}x${originalHeight}`)

        // 2. 调整尺寸
        const {
            canvas: resizedCanvas,
            ctx: resizedCtx,
            width,
            height,
            wasResized
        } = resizeForOCR(canvas, ctx, originalWidth, originalHeight)

        if (wasResized) {
            console.log(`📐 调整后尺寸: ${width}x${height}`)
        }

        // 3. 转换为灰度（如果启用）
        if (convertToGray) {
            convertToGrayscale(resizedCanvas, resizedCtx, width, height)
            console.log('⚫ 已转换为灰度图像')
        }

        // 4. 增强对比度（如果启用）
        if (doEnhanceContrast) {
            enhanceContrast(resizedCanvas, resizedCtx, width, height, contrastFactor)
            console.log(`🔆 已增强对比度 (因子: ${contrastFactor})`)
        }

        // 5. 锐化处理（如果启用）
        if (sharpen) {
            sharpenImage(resizedCanvas, resizedCtx, width, height)
            console.log('✨ 已应用锐化效果')
        }

        // 6. 转换为Base64
        const processedDataUrl = resizedCanvas.toDataURL('image/jpeg', quality)

        const processingTime = Date.now() - startTime
        console.log(`✅ 图片预处理完成，耗时: ${processingTime}ms`)

        // 计算文件大小信息
        const originalSizeKB = Math.round(file.size / 1024)
        const processedSizeKB = Math.round(processedDataUrl.length * 0.75 / 1024)

        return {
            success: true,
            processedImage: processedDataUrl,
            previewImage: processedDataUrl, // 用于显示预览
            metadata: {
                originalSize: { width: originalWidth, height: originalHeight },
                processedSize: { width, height },
                fileSizes: {
                    original: originalSizeKB,
                    processed: processedSizeKB,
                    compressionRatio: Math.round((1 - processedSizeKB / originalSizeKB) * 100)
                },
                processingTime,
                settings: {
                    convertToGray,
                    enhanceContrast: doEnhanceContrast,
                    contrastFactor,
                    sharpen,
                    quality,
                    wasResized
                }
            }
        }

    } catch (error) {
        console.error('🚨 图片预处理失败:', error)
        return {
            success: false,
            error: error.message || '图片处理失败'
        }
    }
}

/**
 * 创建预览图片（较小尺寸，用于UI显示）
 */
export const createPreviewImage = (dataUrl, maxSize = 300) => {
    return new Promise((resolve) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
            const { width, height } = img

            // 计算预览尺寸
            let previewWidth = width
            let previewHeight = height

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height)
                previewWidth = Math.round(width * ratio)
                previewHeight = Math.round(height * ratio)
            }

            canvas.width = previewWidth
            canvas.height = previewHeight

            ctx.drawImage(img, 0, 0, previewWidth, previewHeight)

            resolve({
                previewDataUrl: canvas.toDataURL('image/jpeg', 0.8),
                previewSize: { width: previewWidth, height: previewHeight }
            })
        }

        img.src = dataUrl
    })
}
