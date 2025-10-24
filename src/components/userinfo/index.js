import './index.css';
import logo from '../../logo.svg'

function UserInfo(props) {

    let userInfo = props.userInfo
    if (!userInfo) {
        userInfo = {} 
    }

    return (
        <div className='userinfo'>
        </div>
    );
}

export default UserInfo;
