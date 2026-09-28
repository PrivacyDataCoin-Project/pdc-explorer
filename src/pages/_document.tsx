import { Html, Head, Main, NextScript } from 'next/document';

function Document() {
    return (
        <Html lang="en">
            <Head />
            <body className='custom-scroll'>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

export default Document;
