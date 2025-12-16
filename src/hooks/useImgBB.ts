export async function uploadImageToImgBB(file: File): Promise<string> {
    if (!file) throw new Error('Файл не вибраний')

    const maxSize = 32 * 1024 * 1024 // 32MB
    if (file.size > maxSize) throw new Error('Файл надто великий (макс. 32MB)')

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
        throw new Error('Недійсний формат. Дозволені: JPG, PNG, WebP, GIF')
    }

    const formData = new FormData()
    formData.append('image', file)

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    if (!apiKey) throw new Error('ImgBB API ключ не знайдено')

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Помилка завантаження фото')
    }

    const data = await response.json()
    return data.data.url // Повертаємо прямий URL
}
