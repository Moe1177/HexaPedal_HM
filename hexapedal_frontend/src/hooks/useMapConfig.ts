import loadMapConfig, { fallBackMapConfig } from '@/app/services/utils/loadMapConfig';
import { useEffect, useState } from 'react';

export default function useMapConfig() {
    const [mapConfig, setMapConfig] = useState(fallBackMapConfig);

    // Asynchronously load the config
    useEffect(() => {
        async function fetchConfig() {
            const config = await loadMapConfig();
            setMapConfig(config);
        }

        fetchConfig();
    }, [])

    return [mapConfig, setMapConfig];
}
