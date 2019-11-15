import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import Provider from 'react-redux/es/components/Provider';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import { middleware, reducers } from './store';

const store = createStore(reducers, applyMiddleware(thunk, middleware()));

ReactDOM.render((
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
), document.getElementById('root'));


window.getGridHeight = function() {
    return (document.querySelector('html').clientHeight - 220) + 'px';
};

window.onresize = function() {
    const grid = document.querySelector('.dx-datagrid.dx-gridbase-container');
    if (grid) {
        const height = window.getGridHeight();
        grid.parentElement.style.height = height;
        console.log(height);
    }
};
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
