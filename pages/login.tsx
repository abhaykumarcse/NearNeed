import { useState } from 'react';
import { PasswordLoginForm } from '../components/PasswordLoginForm';
import { PasswordRegisterForm } from '../components/PasswordRegisterForm';
import { Zap } from 'lucide-react';
import { OAuthButtonGroup } from '../components/OAuthButtonGroup';
import styles from './login.module.css';

export default function Login() {
  const [register, setRegister] = useState(false);
  return <main className={styles.page}><div className={styles.card}><div className={styles.brand}><span><Zap size={18}/></span> NearNeed</div><h1>{register ? 'Join your nearby network' : 'Welcome back'}</h1><p>{register ? 'Create an account to add your items and help people within 500m.' : 'Sign in to request needs and share what you have.'}</p><div className={styles.google}><OAuthButtonGroup/></div><div className={styles.divider}><span>or continue with email</span></div>{register ? <PasswordRegisterForm/> : <PasswordLoginForm/>}<button className={styles.switcher} onClick={()=>setRegister(!register)}>{register ? 'Already have an account? Log in' : 'New here? Create account'}</button></div></main>;
}