import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'

const schema = yup.object().shape({
  email: yup.string().email('email_invalid').required('email_required'),
  password: yup.string().min(8, 'password_min').required('password_required')
})

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/api/login', data)

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        toast.success(t('login_success'), { autoClose: 1000 })
        setTimeout(() => navigate('/'), 1000)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response && error.response.status === 401) {
        setError('password', {
          type: 'manual',
          message: t('login_failed')
        })
        toast.error(t('login_failed'), { autoClose: 2000 })
      } else {
        toast.error(t('system_error'), { autoClose: 2000 })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className='flex justify-center items-center h-[500px] bg-gray-100 px-4'>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className='w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-lg rounded-lg p-6 sm:p-8'
      >
        <h2 className='text-2xl font-semibold text-gray-800 mb-6 text-center'>{t('login')}</h2>

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

          <motion.div whileHover={{ scale: 1.015 }} transition={{ duration: 0.3 }}>
            <label className='block text-sm font-medium text-gray-700'>{t('password')}</label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                className='w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition'
                placeholder={t('password_placeholder')}
                {...register('password')}
              />
              <button
                type='button'
                onClick={togglePasswordVisibility}
                className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700'
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
            {errors.password && <span className='text-red-500 text-sm'>{t(errors.password.message)}</span>}
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
            {isLoading ? t('logging_in') : t('login_button')}
          </motion.button>
        </form>

        <p className='text-gray-600 mt-6 text-center text-sm flex justify-between'>
          <span>
            {t('no_account')}{' '}
            <Link to='/register' className='text-blue-500 hover:underline'>
              {t('register')}
            </Link>
          </span>
          <Link to='/forgot-password' className='text-blue-500 hover:underline'>
            {t('forgot_password')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Login
