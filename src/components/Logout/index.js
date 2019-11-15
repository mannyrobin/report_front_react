import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function Logout() {
    return (
        <div style={{ position: 'relative' }}>
            <CircularProgress style={{ position: 'absolute', left: 'calc(50vh - 20px)', right: 'calc(60vw - 20px)' }} />
        </div>
    )
}
