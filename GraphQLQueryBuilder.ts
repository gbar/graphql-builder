import { isEmpty, isNil } from 'ramda';

enum OperationType {
  Mutation = 'mutation',
  Query = 'query',
  Subscription = 'subscription',
}

type ParamOption = string | number | boolean | Date | ParamOptions | Array<ParamOption>;

type ParamOptions = { [key: string]: ParamOption };

type VariableOption = {
  type: string;
  name: string;
  value: ParamOption;
  list?: boolean;
  required?: boolean;
};

type VariableOptions = { [key: string]: VariableOption };

type NestedField = { [key: string]: Array<Field> };

type Field = string | NestedField | OperationOptions;

export interface OperationOptions {
  key?: string;
  functionName: string;
  fields?: Array<Field>;
  params?: ParamOptions;
  variables?: VariableOptions;
}

const isOperation = (object): object is OperationOptions =>
  typeof object === 'object' && object.hasOwnProperty('functionName');

export type GraphQLRequest = { request: string; variables: ParamOptions };

export class GraphQLQueryBuilder {
  private variableDefinitions: Record<string, string> = {};
  private variables: ParamOptions = {};

  private clear = () => {
    this.variableDefinitions = {};
    this.variables = {};
  };

  private buildFields = (fields: Array<Field>): string => {
    if (isEmpty(fields) || isNil(fields)) {
      return '';
    }

    return ` { ${fields.reduce((query, field) => {
      const _query = query ? `${query} ` : query;

      if (isOperation(field)) {
        return `${_query}${this.buildOperation(field)}`;
      }

      if (typeof field === 'object' && !isEmpty(field)) {
        return `${_query}${Object.entries(field).reduce((subQuery, [key, value]) => {
          const fields = this.buildFields(value);

          return `${subQuery}${key}${fields}`;
        }, '')}`;
      }

      return `${_query}${field}`;
    }, '')} }`;
  };

  private buildOperation = (options: OperationOptions | OperationOptions[], operationType?: OperationType): string => {
    const _options = Array.isArray(options) ? options : [options];

    const query = _options.reduce((query, option) => {
      const _query = query ? `${query} ` : query;
      const key = option?.key ? `${option.key}: ` : '';
      const variables = this.buildVariables(option?.variables);
      const params = isEmpty(variables) ? this.buildParams(option?.params) : '';
      const fields = this.buildFields(option?.fields);

      return `${_query}${key}${option.functionName}${variables}${params}${fields}`;
    }, '');

    if (isEmpty(query) || isNil(query)) {
      return '';
    }

    if (isEmpty(operationType) || isNil(operationType)) {
      return query;
    }

    const definitions = !isEmpty(this.variableDefinitions)
      ? `(${Object.values(this.variableDefinitions).join(', ')})`
      : '';

    return `${operationType}${definitions} { ${query} }`;
  };

  private resolveParamType = (param: { key?: string; option: ParamOption }): string => {
    const { key, option } = param;
    const _key = key ? `${key}: ` : '';

    if (typeof option === 'boolean' || typeof option === 'number' || isNil(option)) {
      return `${_key}${option}`;
    }

    if (option instanceof Date) {
      return `${_key}"${option.toISOString()}"`;
    }

    if (Array.isArray(option)) {
      return `${_key}${this.buildParams(option, { array: true })}`;
    }

    if (typeof option === 'object' && !isNil(option)) {
      return `${_key}${this.buildParams(option, { object: true })}`;
    }

    return `${_key}"${option}"`;
  };

  private buildParams = (
    options: ParamOptions | Array<ParamOption>,
    nested?: { array?: boolean; object?: boolean }
  ): string => {
    if (isEmpty(options) || isNil(options)) {
      return '';
    }

    let output = '';
    if (Array.isArray(options)) {
      output = `${options.map((option) => this.resolveParamType({ option })).join(', ')}`;
    } else {
      output = `${Object.entries(options)
        .map(([key, option]) => this.resolveParamType({ key, option }))
        .join(' ')}`;
    }

    return nested?.object ? `{ ${output} }` : nested?.array ? `[ ${output} ]` : `(${output})`;
  };

  private buildVariables = (options: VariableOptions): string => {
    if (isEmpty(options) || isNil(options)) {
      return '';
    }

    const operationVariables: Array<string> = [];
    Object.entries(options).forEach(([key, option]) => {
      const type = `${option.type}${option.required ? '!' : ''}`;
      const definition = `$${key}: ${option.list ? `[${type}]` : type}`;
      const operationVariable = `${option.name}: $${key}`;

      this.variableDefinitions[key] = definition;
      this.variables[key] = option.value;
      operationVariables.push(operationVariable);
    });

    return `(${operationVariables.join(', ')})`;
  };

  createQuery = (options: OperationOptions | OperationOptions[]): GraphQLRequest | void => {
    this.clear();
    const request = this.buildOperation(options, OperationType.Query);

    if (isEmpty(request) || isNil(request)) {
      return;
    }

    return { request, variables: { ...this.variables } };
  };

  createMutation = (options: OperationOptions | OperationOptions[]): GraphQLRequest | void => {
    this.clear();
    const request = this.buildOperation(options, OperationType.Mutation);

    if (isEmpty(request) || isNil(request)) {
      return;
    }

    return { request, variables: { ...this.variables } };
  };
}
