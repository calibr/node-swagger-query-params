interface ValidateOrderRule {
  allowedFields?: string[]
}

interface ValidateParamsRule {
  [jsonPath: string]: (value: any, req: any) => any
}

interface ValidateFilterFieldRule {
  allowedComparators?: string[]
  valueType?: string
  func?: (value: any, req: any) => any
}

interface ValidateFilterRule {
  [fieldName: string]: ValidateFilterFieldRule
}

interface SwaggerQueryParamsMiddlewareParams {
  validateOrder?: ValidateOrderRule
  validateParams?: ValidateParamsRule
  validateFilter?: ValidateFilterRule
}

declare function swaggerQueryParamsMiddlewareFactory(middlewareOptions: SwaggerQueryParamsMiddlewareParams);

export = swaggerQueryParamsMiddlewareFactory