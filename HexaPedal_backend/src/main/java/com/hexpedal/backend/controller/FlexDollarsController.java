package com.hexpedal.backend.controller;

import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.service.FlexDollarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FlexDollarsController {

    @Autowired
    private FlexDollarService flexdollarservice;

    @PostMapping("/{id}/add-flex")
    public Rider addFlexDollars(@PathVariable Long id,@RequestParam int amount){
        return (Rider) flexdollarservice.addFlexDollars(id,amount);
    }


}
