package com.applytrack;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end tests of the REST API against an in-memory H2 database. */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        token = registerNewUser();
    }

    // ---------- auth ----------

    @Test
    void registerThenLoginReturnsToken() throws Exception {
        String email = uniqueEmail();
        register(email).andExpect(status().isCreated());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email.toUpperCase() + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = uniqueEmail();
        register(email).andExpect(status().isCreated());
        register(email).andExpect(status().isConflict());
    }

    @Test
    void wrongPasswordReturns401() throws Exception {
        String email = uniqueEmail();
        register(email).andExpect(status().isCreated());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void invalidRegistrationReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"not-an-email\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void requestsWithoutTokenAreRejected() throws Exception {
        mvc.perform(get("/api/applications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/applications").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- applications ----------

    @Test
    void createReadUpdateDeleteApplication() throws Exception {
        long id = createApplication("Acme Corp", "Software Engineer", "APPLIED");

        mvc.perform(authed(get("/api/applications/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("Acme Corp"))
                .andExpect(jsonPath("$.status").value("APPLIED"));

        mvc.perform(authed(put("/api/applications/" + id)).contentType(MediaType.APPLICATION_JSON)
                        .content(applicationJson("Acme Corp", "Full Stack Engineer", "INTERVIEWING")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("Full Stack Engineer"))
                .andExpect(jsonPath("$.status").value("INTERVIEWING"));

        mvc.perform(authed(delete("/api/applications/" + id))).andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/applications/" + id))).andExpect(status().isNotFound());
    }

    @Test
    void invalidApplicationIsRejected() throws Exception {
        mvc.perform(authed(post("/api/applications")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"company\":\"\",\"role\":\"Dev\",\"status\":\"APPLIED\",\"jobUrl\":\"ftp://x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.company").exists())
                .andExpect(jsonPath("$.errors.jobUrl").exists());
    }

    @Test
    void listSupportsStatusFilterAndSearch() throws Exception {
        createApplication("Google", "Backend Engineer", "APPLIED");
        createApplication("Microsoft", "Frontend Engineer", "INTERVIEWING");
        createApplication("Amazon", "Full Stack Developer", "APPLIED");

        mvc.perform(authed(get("/api/applications")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));

        mvc.perform(authed(get("/api/applications").param("status", "APPLIED")))
                .andExpect(jsonPath("$.content", hasSize(2)));

        mvc.perform(authed(get("/api/applications").param("q", "micro")))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].company").value("Microsoft"));

        mvc.perform(authed(get("/api/applications").param("size", "2")))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void statusPatchSetsAppliedDateWhenMissing() throws Exception {
        long id = createApplication("Netflix", "SWE", "SAVED");

        mvc.perform(authed(patch("/api/applications/" + id + "/status")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APPLIED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.appliedDate").isNotEmpty());
    }

    @Test
    void usersCannotSeeEachOthersApplications() throws Exception {
        long id = createApplication("Private Co", "Engineer", "APPLIED");
        String otherToken = registerNewUser();

        mvc.perform(get("/api/applications/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/applications").header("Authorization", "Bearer " + otherToken))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void statsSummarizePipeline() throws Exception {
        createApplication("A", "Dev", "SAVED");
        createApplication("B", "Dev", "APPLIED");
        createApplication("C", "Dev", "INTERVIEWING");
        createApplication("D", "Dev", "REJECTED");

        mvc.perform(authed(get("/api/applications/stats")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.submitted").value(3))
                .andExpect(jsonPath("$.byStatus.INTERVIEWING").value(1))
                .andExpect(jsonPath("$.responseRate").value(66.7))
                .andExpect(jsonPath("$.weekly", hasSize(8)));
    }

    // ---------- helpers ----------

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder authed(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder builder) {
        return builder.header("Authorization", "Bearer " + token);
    }

    private long createApplication(String company, String role, String status) throws Exception {
        MvcResult result = mvc.perform(authed(post("/api/applications")).contentType(MediaType.APPLICATION_JSON)
                        .content(applicationJson(company, role, status)))
                .andExpect(status().isCreated())
                .andReturn();
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private static String applicationJson(String company, String role, String status) {
        String date = "SAVED".equals(status) ? "null" : "\"" + LocalDate.now() + "\"";
        return "{\"company\":\"" + company + "\",\"role\":\"" + role + "\",\"location\":\"Dallas, TX\","
                + "\"jobUrl\":\"https://example.com/job\",\"status\":\"" + status + "\","
                + "\"appliedDate\":" + date + ",\"notes\":\"\"}";
    }

    private String registerNewUser() throws Exception {
        MvcResult result = register(uniqueEmail()).andExpect(status().isCreated()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    private org.springframework.test.web.servlet.ResultActions register(String email) throws Exception {
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test User\",\"email\":\"" + email + "\",\"password\":\"password123\"}"));
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }
}
