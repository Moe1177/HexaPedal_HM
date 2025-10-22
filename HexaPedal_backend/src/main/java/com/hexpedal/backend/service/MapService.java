package com.hexpedal.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;

@Service
public class MapService {

    public String loadMapConfig() {
        try {
            URL resource = getClass().getClassLoader().getResource("mapConfig.json");
            System.out.println("Resource URL: " + resource);
            if (resource == null) {
                throw new IOException("mapConfig.json not found in resources");
            }
            Path resourcePath = Paths.get(resource.toURI());
            String content = Files.readString(resourcePath);
            return content;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load mapConfig.json", e);
        }
    }
}
