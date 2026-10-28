const OPTIMIZED_PREFIXES = [
['/templates/rank-common-4k/', '/optimized-images/rank-common-4k/'],
['/rank-assets/', '/optimized-images/rank-assets/'],
['/assets/categories/', '/optimized-images/categories/'],
];

export function getOptimizedImagePath(src) {
if (!src || typeof src !== 'string') return src;

for (const [originalPrefix, optimizedPrefix] of OPTIMIZED_PREFIXES) {
if (src.startsWith(originalPrefix)) {
const optimizedPath = src.replace(originalPrefix, optimizedPrefix);
return optimizedPath.replace(/.(png|jpe?g)$/i, '.webp');
}
}

return src;
}

export function handleImageFallback(event, originalSrc) {
const image = event.currentTarget;

if (image.dataset.fallbackApplied === 'true') return;

image.dataset.fallbackApplied = 'true';
image.src = originalSrc;
}
