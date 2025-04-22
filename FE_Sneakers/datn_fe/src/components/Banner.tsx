import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const Banner = () => {
  const location = useLocation()

  if (location.pathname !== '/') {
    return null
  }

  const images = [
    'https://i1252.photobucket.com/albums/hh579/Shopburin/banner01_zpsddaf983d.jpg',
    'https://giaysneaker.store/media/wysiwyg/slidershow/home-12/banner_ADIDAS.jpg',
    'https://www.caoto.vn/images/slider-2.png'
  ] 

  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className='relative w-full h-[500px] sm:h-[600px] lg:h-[500px] overflow-hidden'>
      <AnimatePresence>
        <motion.div
          key={currentImage}
          className='absolute top-0 left-0 w-full h-full'
          style={{
            backgroundImage: `url(${images[currentImage]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </AnimatePresence>
    </div>
  )
}

export default Banner
