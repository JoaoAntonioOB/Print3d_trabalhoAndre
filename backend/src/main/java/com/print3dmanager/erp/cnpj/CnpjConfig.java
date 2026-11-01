package com.print3dmanager.erp.cnpj;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CnpjConfig {

    @Bean
    public BrasilApiClient brasilApiClient(
            @Value("${application.cnpj.base-url:https://brasilapi.com.br/api/cnpj/v1}") String baseUrl,
            @Value("${application.cnpj.timeout-ms:4000}") long timeoutMs) {
        Duration timeout = Duration.ofMillis(timeoutMs);
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(timeout).build());
        factory.setReadTimeout(timeout);
        return new BrasilApiClient(RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build());
    }
}
