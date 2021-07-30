import { FC } from 'react';

import Chat from 'components/chat/Chat';

import 'modern-css-reset';
import 'normalize.css';
import styles from './App.module.scss';

const App: FC = () => {
    return (
        <div className={styles.App}>
            <Chat />
        </div>
    );
};

export default App;
