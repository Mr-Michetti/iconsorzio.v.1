import NextErrorComponent from 'next/error';

const CustomErrorComponent = ({ statusCode }) => {
    return <NextErrorComponent statusCode={statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
    return NextErrorComponent.getInitialProps(contextData);
};

export default CustomErrorComponent;
