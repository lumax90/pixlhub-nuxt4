// Global shared state
const globalSettings = ref({
  showClasses: true,
  crosshair: false,
  opacity: 85,
  pointRadius: 6,
  border: 1.5,
  freeformDensity: 5, // Point density for freeform tool (1-10) - higher = more points
  invert: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100
})

export const useCanvasSettings = () => {
  // Computed CSS filter string for image adjustments
  const imageFilter = computed(() => {
    const filters = []
    
    if (globalSettings.value.invert > 0) {
      filters.push(`invert(${globalSettings.value.invert}%)`)
    }
    if (globalSettings.value.brightness !== 100) {
      filters.push(`brightness(${globalSettings.value.brightness}%)`)
    }
    if (globalSettings.value.contrast !== 100) {
      filters.push(`contrast(${globalSettings.value.contrast}%)`)
    }
    if (globalSettings.value.saturation !== 100) {
      filters.push(`saturate(${globalSettings.value.saturation}%)`)
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none'
  })

  // Annotation opacity (0-1 scale)
  const annotationOpacity = computed(() => globalSettings.value.opacity / 100)

  // Border width for annotations
  const borderWidth = computed(() => globalSettings.value.border)

  // Point radius for point annotations
  const pointRadius = computed(() => globalSettings.value.pointRadius)

  const resetImageAdjustments = () => {
    globalSettings.value.invert = 0
    globalSettings.value.brightness = 100
    globalSettings.value.contrast = 100
    globalSettings.value.saturation = 100
  }

  return {
    settings: globalSettings,
    imageFilter,
    annotationOpacity,
    borderWidth,
    pointRadius,
    resetImageAdjustments
  }
}
