import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "테스트",
      description:
        "테스트 프로젝트",
    },
    servers: [
      {
        url: "http://localhost:3000", // 요청 URL
      },
    ],
  },
  apis: ["./*.js"], // Swagger 파일 연동
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };