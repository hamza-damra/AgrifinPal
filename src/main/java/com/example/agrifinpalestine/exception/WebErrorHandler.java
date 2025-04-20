package com.example.agrifinpalestine.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@ControllerAdvice
public class WebErrorHandler {

    private static final Logger logger = LoggerFactory.getLogger(WebErrorHandler.class);

    @ExceptionHandler(NoHandlerFoundException.class)
    public ModelAndView handleNoHandlerFoundException(NoHandlerFoundException ex, HttpServletRequest request) {
        logger.error("No handler found for {} {}", request.getMethod(), request.getRequestURI());
        
        ModelAndView mav = new ModelAndView();
        mav.addObject("errorPath", request.getRequestURI());
        mav.addObject("errorMessage", "The page you are looking for does not exist.");
        mav.setViewName("error/404");
        return mav;
    }
    
    @ExceptionHandler(NoResourceFoundException.class)
    public ModelAndView handleNoResourceFoundException(NoResourceFoundException ex, HttpServletRequest request) {
        logger.error("No resource found for {}", request.getRequestURI());
        
        ModelAndView mav = new ModelAndView();
        mav.addObject("errorPath", request.getRequestURI());
        mav.addObject("errorMessage", "The resource you are looking for does not exist.");
        mav.setViewName("error/404");
        return mav;
    }
}
