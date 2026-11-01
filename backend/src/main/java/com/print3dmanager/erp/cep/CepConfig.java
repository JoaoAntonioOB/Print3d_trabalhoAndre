package com.print3dmanager.erp.cep;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CepConfig {

    @Bean
    public ViaCepClient viaCepClient(
            @Value("${application.cep.base-url:https://viacep.com.br/ws}") String baseUrl,
            @Value("${application.cep.timeout-ms:3000}") long timeoutMs) {
        Duration timeout = Duration.ofMillis(timeoutMs);
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(timeout).build());
        factory.setReadTimeout(timeout);
        return new ViaCepClient(RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build());
    }
}
