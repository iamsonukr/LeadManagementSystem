"use client"
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

const MyProfile = () => {

    const { user }=useAuth()

    useEffect(()=>{
        console.log("This is user", user )
    },[])

  return (
    <div>
        <h1>This is your profile</h1>
    </div>
  )
}

export default MyProfile