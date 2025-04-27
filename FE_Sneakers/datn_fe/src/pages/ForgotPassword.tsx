import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const schema = yup.object().shape({
  email: yup.string().email('email_invalid').required('email_required')
})

const ForgotPassword = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/api/forgot-password', { email: data.email })
      toast.success(t('reset_password_success'), { autoClose: 2000 })
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      toast.error(t('reset_password_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex justify-center items-center h-[400px] bg-gray-100 px-4'>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className='w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-lg rounded-lg p-6 sm:p-8'
      >
        <h2 className='text-2xl font-semibold text-gray-800 mb-6 text-center'>{t('forgot_password')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          <motion.div whileHover={{ scale: 1.015 }} transition={{ duration: 0.3 }}>
            <label className='block text-sm font-medium text-gray-700'>{t('email')}</label>
            <input
              type='email'
              className='w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition'
              placeholder={t('email_placeholder')}
              {...register('email')}
            />
            {errors.email && <span className='text-red-500 text-sm'>{t(errors.email.message)}</span>}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3 }}
            type='submit'
            disabled={isLoading}
            className={`w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition flex items-center justify-center ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <svg
                className='animate-spin h-5 w-5 mr-2 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            ) : null}
            {isLoading ? t('sending') : t('send_request')}
          </motion.button>
        </form>

        <p className='text-gray-600 mt-6 text-center text-sm'>
          {t('have_account')}{' '}
          <Link to='/login' className='text-blue-500 hover:underline'>
            {t('login')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
