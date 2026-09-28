import PageState from "../../../interfaces/common/PageState";
import { Dispatch, SetStateAction } from "react";

interface HeaderProps {
    page: PageState;
    burgerOpened: boolean;
    setBurgerOpened: Dispatch<SetStateAction<boolean>>;
}

export default HeaderProps;