package com.glowexplore.demo.controller;

import com.glowexplore.demo.model.Provider;
import com.glowexplore.demo.repository.ProviderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

/**
 * Ban rut gon cua 2 route:
 *  - GET /{serviceSlug}  (pj-fe)      -> GET /providers   (o day)
 *  - GET /provider/{slug} (pj-fe)     -> GET /providers/{slug}
 */
@Controller
public class ProviderController {

    private final ProviderRepository providerRepository;

    @Autowired
    public ProviderController(ProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    @GetMapping({"/", "/providers"})
    public String list(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String service,
            @RequestParam(required = false, defaultValue = "rating") String sortBy,
            Model model) {

        List<Provider> results = providerRepository.search(city, service, sortBy);

        model.addAttribute("providers", results);
        model.addAttribute("cities", providerRepository.findAllCities());
        model.addAttribute("services", providerRepository.findAllServices());
        model.addAttribute("selectedCity", city);
        model.addAttribute("selectedService", service);
        model.addAttribute("sortBy", sortBy);
        return "providers/list";
    }

    @GetMapping("/providers/{slug}")
    public String detail(@PathVariable String slug, Model model, RedirectAttributes redirectAttributes) {
        Optional<Provider> found = providerRepository.findBySlug(slug);
        if (found.isEmpty()) {
            redirectAttributes.addFlashAttribute("notFoundSlug", slug);
            return "redirect:/providers";
        }
        model.addAttribute("provider", found.get());
        return "providers/detail";
    }
}
