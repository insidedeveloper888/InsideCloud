import React, { useEffect, useState } from "react"
//components
import TopBar from "../../components/topbar"
import UserInfo from "../../components/userinfo"
import UseAPI from '../../components/useapi'
import DepartmentsList from "../../components/departmentsList"
import MembersList from "../../components/membersList"
import BitableTables from "../../components/bitableTables"
//
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util'
import './index.css'

export default function Home() {

    const [userInfo, setUserInfo] = useState({})
    useEffect(() => {
        //鉴权处理
        handleJSAPIAccess((isSucces) => {
            console.log('handleJSAPIAccess OK: ', isSucces)
            //免登处理
            handleUserAuth((userInfo) => {
                setUserInfo(userInfo)
            })
        })
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="home">
            <TopBar userInfo={userInfo} />
            <div className="home-content">
                <UserInfo userInfo={userInfo} />
                <UseAPI />
                <DepartmentsList />
                <MembersList />
                <BitableTables />
            </div>
        </div>
    );
}