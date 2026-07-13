export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A9BF5' },
  { id: 'x', label: 'X', color: '#9CA3AF' },
  { id: 'facebook', label: 'Facebook', color: '#4267F5' },
  { id: 'tiktok', label: 'TikTok', color: '#2DD4BF' },
]

export const FORMATS = ['Reel', 'Carousel', 'Static', 'Video']

export const STATUSES = ['Idea', 'Designing', 'For Review', 'Approved', 'Posted']

export const STATUS_COLORS = {
  Idea: '#9CA3AF',
  Designing: '#FF6B35',
  'For Review': '#FACC15',
  Approved: '#2DD4BF',
  Posted: '#818CF8',
}

export const IMAGE_SIZES = [
  { id: 'ig-square', label: 'Instagram Square', w: 1080, h: 1080, platform: 'instagram' },
  { id: 'ig-portrait', label: 'Instagram Portrait', w: 1080, h: 1350, platform: 'instagram' },
  { id: 'ig-story', label: 'Instagram Story', w: 1080, h: 1920, platform: 'instagram' },
  { id: 'facebook', label: 'Facebook', w: 1200, h: 630, platform: 'facebook' },
  { id: 'linkedin', label: 'LinkedIn', w: 1200, h: 627, platform: 'linkedin' },
]

export const platformById = (id) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[0]

export const defaultSizeForPlatform = (platformId) => {
  const match = IMAGE_SIZES.find((s) => s.platform === platformId)
  return match ? match.id : 'ig-square'
}
