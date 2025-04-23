import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'

const schema = yup.object().shape({
  name: yup.string().required('name_required'),
  address: yup.string().required('address_required'),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'phone_invalid')
    .required('phone_required')
})

const ProfilePage = () => {
  const { t } = useTranslation()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editField, setEditField] = useState({ name: false, address: false, phone: false })
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', image_user: null })
  const [errors, setErrors] = useState({ name: '', address: '', phone: '' })

  const defaultImage = 'https://i.pinimg.com/474x/2a/f6/cd/2af6cde7dd1c03451c92bdd4deefedc6.jpg'

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error(t('no_token'))
      }

      const response = await fetch('http://127.0.0.1:8000/api/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `${t('fetch_error')}: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched user data:', data)
      setUserData(data)
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        image_user: null
      })
    } catch (error) {
      setError(error.message)
      toast.error(error.message || t('fetch_error'), { autoClose: 2000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [t])

  const handleEditToggle = (field) => {
    setEditField((prev) => ({ ...prev, [field]: !prev[field] }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleInputChange = (e, field) => {
    const value = field === 'image_user' ? e.target.files[0] : e.target.value
    console.log(`Input changed - ${field}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value)
    if (field === 'image_user') {
      toast.warn('Vui lòng nạp VIP để thay đổi ảnh.', { autoClose: 3000 })
      return
    }
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value }
      console.log('Updated formData:', newFormData)
      return newFormData
    })
  }

  const handleSaveChanges = async () => {
    try {
      await schema.validate(
        { name: formData.name, address: formData.address, phone: formData.phone },
        { abortEarly: false }
      )

      const token = localStorage.getItem('token')
      if (!token) throw new Error(t('no_token'))

      const jsonData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone
      }
      console.log('JSON data to send:', jsonData)

      const response = await fetch('http://127.0.0.1:8000/api/user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(jsonData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error response:', errorData)
        if (errorData.errors) {
          const backendErrors = Object.values(errorData.errors).flat().join(', ')
          throw new Error(backendErrors)
        }
        throw new Error(errorData.message || `${t('update_error')}: ${response.status}`)
      }

      const updatedData = await response.json()
      setUserData(updatedData.data)
      setFormData((prev) => ({ ...prev, image_user: null }))
      setEditField({ name: false, address: false, phone: false })
      toast.success(t('update_success'), { autoClose: 1000 })
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors = { name: '', address: '', phone: '' }
        error.inner.forEach((err) => (newErrors[err.path] = t(err.message)))
        setErrors(newErrors)
        toast.error(t('validation_error'), { autoClose: 2000 })
      } else {
        toast.error(error.message || t('update_error'), { autoClose: 2000 })
      }
    }
  }

  const SkeletonLoading = () => (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-poppins'>
      <div className='max-w-5xl mx-auto mx-6 animate-pulse'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='bg-white p-6 rounded-2xl shadow-lg min-w-[200px]'>
            <div className='space-y-3'>
              <div className='h-10 w-full bg-gray-300 rounded-lg'></div>
              <div className='h-10 w-full bg-gray-300 rounded-lg'></div>
              <div className='h-10 w-full bg-gray-300 rounded-lg'></div>
            </div>
          </div>
          <div className='md:col-span-2 bg-white p-8 rounded-2xl shadow-lg'>
            <div className='space-y-6'>
              <div className='flex flex-col items-center'>
                <div className='w-32 h-32 bg-gray-300 rounded-full mb-4'></div>
              </div>
              {['name', 'email', 'address', 'phone'].map((field) => (
                <div key={field} className='space-y-2'>
                  <div className='h-4 w-20 bg-gray-300 rounded'></div>
                  <div className='w-full h-12 bg-gray-300 rounded-lg'></div>
                </div>
              ))}
              <div className='w-full h-12 bg-gray-300 rounded-lg'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) return <SkeletonLoading />
  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-poppins'>
        <div className='max-w-5xl mx-auto mx-6 text-center'>
          <p className='text-red-500 text-lg font-medium'>{error}</p>
          <button
            onClick={fetchUserData}
            className='mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all'
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }
  if (!userData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-12 px-12 sm:px-6 lg:px-8 font-poppins'>
        <div className='max-w-5xl mx-auto mx-6 text-center'>
          <p className='text-gray-700 text-lg font-medium'>{t('no_user_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap' rel='stylesheet' />
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-poppins'>
        <div className='max-w-5xl mx-auto mx-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Sidebar Navigation */}
            <div className='bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl min-w-[200px]'>
              <nav className='space-y-3'>
                <Link
                  to='/profile'
                  className='flex items-center p-3 text-blue-600 bg-blue-50 rounded-lg text-lg font-semibold whitespace-nowrap'
                >
                  <span className='mr-3'>👤</span> {t('my_account')}
                </Link>
                <Link
                  to='/change-password'
                  className='flex items-center p-3 text-gray-700 hover:bg-indigo-50 rounded-lg text-base font-medium transition-all duration-200 whitespace-nowrap'
                >
                  <span className='mr-3'>🔒</span> {t('change_password')}
                </Link>
                <Link
                  to='/orders'
                  className='flex items-center p-3 text-gray-700 hover:bg-indigo-50 rounded-lg text-base font-medium transition-all duration-200 whitespace-nowrap'
                >
                  <span className='mr-3'>📋</span> {t('orders')}
                </Link>
              </nav>
            </div>

            {/* Profile Form */}
            <div className='md:col-span-2 bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <h2 className='text-xl font-semibold text-gray-900 mb-8'>{t('my_account')}</h2>
              <div className='space-y-6'>
                <div className='flex flex-col items-center'>
                  <img
                    src={defaultImage}
                    alt='Avatar'
                    className='w-32 h-32 rounded-full object-cover mb-4 border-2 border-gray-300'
                  />
                  {/* <input
                    type="file"
                    name="image_user"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleInputChange(e, 'image_user')}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                  /> */}
                </div>

                <div className='relative'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>{t('name')}</label>
                  <div className='relative'>
                    <input
                      type='text'
                      className='w-full p-4 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-normal'
                      value={formData.name}
                      onChange={(e) => handleInputChange(e, 'name')}
                      readOnly={!editField.name}
                    />
                    <button
                      onClick={() => handleEditToggle('name')}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 hover:underline text-sm font-medium'
                    >
                      {editField.name ? t('cancel') : t('edit')}
                    </button>
                  </div>
                  {errors.name && <p className='text-red-500 text-sm mt-2'>{errors.name}</p>}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>{t('email')}</label>
                  <input
                    type='email'
                    className='w-full p-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none text-base font-normal'
                    value={userData.email || ''}
                    readOnly
                  />
                </div>

                <div className='relative'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>{t('address')}</label>
                  <div className='relative'>
                    <input
                      type='text'
                      className='w-full p-4 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-normal'
                      value={formData.address}
                      onChange={(e) => handleInputChange(e, 'address')}
                      readOnly={!editField.address}
                    />
                    <button
                      onClick={() => handleEditToggle('address')}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 hover:underline text-sm font-medium'
                    >
                      {editField.address ? t('cancel') : t('edit')}
                    </button>
                  </div>
                  {errors.address && <p className='text-red-500 text-sm mt-2'>{errors.address}</p>}
                </div>

                <div className='relative'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>{t('phone')}</label>
                  <div className='relative'>
                    <input
                      type='text'
                      className='w-full p-4 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-normal'
                      value={formData.phone}
                      onChange={(e) => handleInputChange(e, 'phone')}
                      readOnly={!editField.phone}
                    />
                    <button
                      onClick={() => handleEditToggle('phone')}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 hover:underline text-sm font-medium'
                    >
                      {editField.phone ? t('cancel') : t('edit')}
                    </button>
                  </div>
                  {errors.phone && <p className='text-red-500 text-sm mt-2'>{errors.phone}</p>}
                </div>

                <button
                  onClick={handleSaveChanges}
                  className='w-full py-4 rounded-lg text-white font-medium transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-center'
                >
                  {t('save_changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePage
