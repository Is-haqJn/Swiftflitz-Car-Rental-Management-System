import { Fragment, useState, type SetStateAction } from 'react';
import NavHeader from './NavHeader';
// import ChatBox from "../ChatBox";
import SideBar from './SideBar';
import Header from './Header';

const NavBar = ({
    title,
    onClick: ClickToAddEvent,
}: {
    title?: string;
    onClick?: () => void;
    ClickToAddEvent?: () => void;
}) => {
    const [toggle, setToggle] = useState('');
    const onClick = (name: SetStateAction<string>) =>
        setToggle(toggle === name ? '' : name);
    return (
        <Fragment>
            <NavHeader />
            {/*<ChatBox*/}
            {/*    onClick={() => onClick("chatbox")} toggle={toggle}*/}
            {/*/>*/}
            <Header
                onNote={() => onClick('chatbox')}
                onNotification={() => onClick('notification')}
                onProfile={() => onClick('profile')}
                toggle={toggle}
                title={title}
                onBox={() => onClick('box')}
                onClick={() => ClickToAddEvent && ClickToAddEvent()}
            />
            <SideBar />
        </Fragment>
    );
};
export default NavBar;
