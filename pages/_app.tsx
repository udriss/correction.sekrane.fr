import { AppProps } from 'next/app';
import { ThemeProvider } from '@/theme/ThemeContext';
import Layout from '@/components/layout/Layout'; // Assuming you have a Layout component

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
