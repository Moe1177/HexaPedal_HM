import loadMapConfig from '@/app/services/utils/loadMapConfig';
import { useState } from 'react';

export default function useMapConfig() {
    const [mapConfig, setMapConfig] = useState(loadMapConfig());
    return [mapConfig, setMapConfig];
}
