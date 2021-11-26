import { GraphQLQueryBuilder } from './GraphQLQueryBuilder'

describe('GraphQLQueryBuilder', () => {
  describe('Query requests', () => {
    it('should build query with nested fields', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery({
        functionName: 'orders',
        fields: [
          'id',
          'tax',
          {
            user: [
              'id',
              'name',
              'email',
              {
                address: ['city', 'state'],
              },
            ],
          },
        ],
      })

      expect(query).toMatchObject({
        request: 'query { orders { id tax user { id name email address { city state } } } }',
        variables: {},
      })
    })

    it('should build query with params', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery({
        functionName: 'userLogin',
        fields: ['id', 'token'],
        params: {
          email: 'jon.doe@example.com',
          password: 'pass',
        },
      })

      expect(query).toMatchObject({
        request: 'query { userLogin(email: "jon.doe@example.com" password: "pass") { id token } }',
        variables: {},
      })
    })

    it('should build query with nested operation', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery([
        {
          functionName: 'someOperation',
          fields: [
            {
              functionName: 'anotherOperation',
              fields: ['field1'],
              params: { id: 123 },
            },
          ],
          params: { id: 456 },
        },
      ])

      expect(query).toMatchObject({
        request: 'query { someOperation(id: 456) { anotherOperation(id: 123) { field1 } } }',
        variables: {},
      })
    })

    it('should build query with multiple operation without fields', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery([
        {
          functionName: 'getFilteredCustomersCount',
        },
        {
          functionName: 'getAllCustomersCount',
          fields: [],
        },
        {
          functionName: 'getFilteredCustomers',
          fields: [
            {
              count: [],
            },
          ],
        },
      ])

      expect(query).toMatchObject({
        request: 'query { getFilteredCustomersCount getAllCustomersCount getFilteredCustomers { count } }',
        variables: {},
      })
    })

    it('should build query with multiple operation, complex params and alias', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery([
        {
          key: 'alias1',
          functionName: 'customer',
          fields: ['id', { functionName: 'nonCanonicalProperties', params: { names: ['name1', 'name2', 'name3'] } }],
          params: { identity: { sourceId: 'sourceId1', sourceName: 'latam' } },
        },
        {
          key: 'alias2',
          functionName: 'customer',
          fields: ['id'],
          params: { identity: { sourceId: 'sourceId2', sourceName: 'latam' } },
        },
        {
          key: 'alias3',
          functionName: 'customer',
          fields: ['id'],
          params: { identity: { sourceId: 'sourceId3', sourceName: 'latam' } },
        },
        {
          key: 'alias4',
          functionName: 'customer',
          fields: ['title'],
          params: { id: 'some-id' },
        },
      ])

      expect(query).toMatchObject({
        request:
          'query { alias1: customer(identity: { sourceId: "sourceId1" sourceName: "latam" }) { id nonCanonicalProperties(names: [ "name1", "name2", "name3" ]) } alias2: customer(identity: { sourceId: "sourceId2" sourceName: "latam" }) { id } alias3: customer(identity: { sourceId: "sourceId3" sourceName: "latam" }) { id } alias4: customer(id: "some-id") { title } }',
        variables: {},
      })
    })

    it('should build query with multiple operation, complex variables and alias', async () => {
      const builder = new GraphQLQueryBuilder()
      const query = builder.createQuery([
        {
          key: 'alias1',
          functionName: 'customer',
          fields: ['id'],
          params: { identity: { sourceId: 'sourceId1', sourceName: 'latam' } },
          variables: {
            identity1: {
              type: 'IdentityInput',
              name: 'identity',
              value: { sourceId: 'sourceId1', sourceName: 'latam' },
            },
          },
        },
        {
          key: 'alias2',
          functionName: 'customer',
          fields: ['id'],
          variables: {
            identity2: {
              type: 'IdentityInput',
              name: 'identity',
              value: { sourceId: 'sourceId2', sourceName: 'latam' },
            },
          },
        },
        {
          key: 'alias3',
          functionName: 'customer',
          fields: ['id'],
          variables: {
            identity3: {
              type: 'IdentityInput',
              name: 'identity',
              value: { sourceId: 'sourceId3', sourceName: 'latam' },
            },
          },
        },
        {
          key: 'alias4',
          functionName: 'customer',
          fields: ['title'],
          variables: {
            id1: {
              type: 'ID',
              name: 'id',
              value: 'some-id',
            },
          },
        },
      ])

      expect(query).toMatchObject({
        request:
          'query($identity1: IdentityInput, $identity2: IdentityInput, $identity3: IdentityInput, $id1: ID) { alias1: customer(identity: $identity1) { id } alias2: customer(identity: $identity2) { id } alias3: customer(identity: $identity3) { id } alias4: customer(id: $id1) { title } }',
        variables: {
          identity1: { sourceId: 'sourceId1', sourceName: 'latam' },
          identity2: { sourceId: 'sourceId2', sourceName: 'latam' },
          identity3: { sourceId: 'sourceId3', sourceName: 'latam' },
          id1: 'some-id',
        },
      })
    })
  })

  describe('Mutation requests', () => {
    it('should build mutation with params', async () => {
      const builder = new GraphQLQueryBuilder()
      const mutation = builder.createMutation({
        functionName: 'userRegister',
        fields: ['id'],
        params: { name: 'Jon Doe', email: 'jon.doe@example.com', password: 'password' },
      })

      expect(mutation).toMatchObject({
        request: 'mutation { userRegister(name: "Jon Doe" email: "jon.doe@example.com" password: "password") { id } }',
        variables: {},
      })
    })

    it('should build mutation with complex argument', async () => {
      const builder = new GraphQLQueryBuilder()
      const mutation = builder.createMutation({
        functionName: 'setPhone',
        params: {
          phone: { prefix: '+91', number: '9876543210' },
        },
        fields: ['id'],
      })

      expect(mutation).toMatchObject({
        request: 'mutation { setPhone(phone: { prefix: "+91" number: "9876543210" }) { id } }',
        variables: {},
      })
    })

    it('should build mutation with multiple operation, complex params and alias', async () => {
      const date = new Date()
      const dateString = date.toISOString()
      const fields = ['id']

      const builder = new GraphQLQueryBuilder()
      const mutation = builder.createMutation([
        {
          key: 'alias1',
          functionName: 'createCustomer',
          fields,
          params: {
            input: {
              data: { firstName: 'fname', lastName: 'lname', dateOfBirth: date },
              source: { name: 'latam', id: 'external-id1', createdAt: date },
            },
          },
        },
        {
          key: 'alias2',
          functionName: 'createCustomer',
          fields,
          params: {
            input: {
              data: { firstName: 'fname', lastName: 'lname', gender: 'F' },
              source: { name: 'latam', id: 'external-id2', createdAt: date },
            },
          },
        },
        {
          key: 'alias3',
          functionName: 'updateCustomer',
          fields,
          params: {
            input: {
              id: 'internal-uuid3',
              data: { dateOfBirth: date },
              source: { name: 'latam', updatedAt: date },
            },
          },
        },
        {
          key: 'alias4',
          functionName: 'updateCustomer',
          fields,
          params: {
            input: {
              id: 'internal-uuid4',
              data: {
                gender: 'M',
                addresses: {
                  create: [
                    {
                      data: { lat: 1.23, lng: 3.123 },
                      source: { name: 'latam', id: 'external-address-id1', createdAt: date },
                    },
                    {
                      data: { lat: 1.23, lng: 3.123 },
                      source: { name: 'latam', id: 'external-address-id2', createdAt: date },
                    },
                  ],
                },
              },
              source: { name: 'latam', updatedAt: date },
            },
          },
        },
      ])

      expect(mutation).toMatchObject({
        request: `mutation { alias1: createCustomer(input: { data: { firstName: "fname" lastName: "lname" dateOfBirth: "${dateString}" } source: { name: "latam" id: "external-id1" createdAt: "${dateString}" } }) { id } alias2: createCustomer(input: { data: { firstName: "fname" lastName: "lname" gender: "F" } source: { name: "latam" id: "external-id2" createdAt: "${dateString}" } }) { id } alias3: updateCustomer(input: { id: "internal-uuid3" data: { dateOfBirth: "${dateString}" } source: { name: "latam" updatedAt: "${dateString}" } }) { id } alias4: updateCustomer(input: { id: "internal-uuid4" data: { gender: "M" addresses: { create: [ { data: { lat: 1.23 lng: 3.123 } source: { name: "latam" id: "external-address-id1" createdAt: "${dateString}" } }, { data: { lat: 1.23 lng: 3.123 } source: { name: "latam" id: "external-address-id2" createdAt: "${dateString}" } } ] } } source: { name: "latam" updatedAt: "${dateString}" } }) { id } }`,
        variables: {},
      })
    })

    it('should build mutation with multiple operation, complex variables and alias', async () => {
      const date = new Date()
      const fields = ['id']

      const builder = new GraphQLQueryBuilder()
      const mutation = builder.createMutation([
        {
          key: 'alias1',
          functionName: 'createCustomer',
          fields,
          variables: {
            input1: {
              type: 'CreateCustomerInput',
              name: 'input',
              value: {
                data: { firstName: 'fname', lastName: 'lname', dateOfBirth: date },
                source: { name: 'latam', id: 'external-id1', createdAt: date },
              },
            },
          },
        },
        {
          key: 'alias2',
          functionName: 'createCustomer',
          fields,
          variables: {
            input2: {
              type: 'CreateCustomerInput',
              name: 'input',
              value: {
                data: { firstName: 'fname', lastName: 'lname', gender: 'F' },
                source: { name: 'latam', id: 'external-id2', createdAt: date },
              },
            },
          },
        },
        {
          key: 'alias3',
          functionName: 'updateCustomer',
          fields,
          variables: {
            input3: {
              type: 'UpdateCustomerInput',
              name: 'input',
              value: {
                id: 'internal-uuid3',
                data: { dateOfBirth: date },
                source: { name: 'latam', updatedAt: date },
              },
            },
          },
        },
        {
          key: 'alias4',
          functionName: 'updateCustomer',
          fields,
          variables: {
            input4: {
              type: 'UpdateCustomerInput',
              name: 'input',
              value: {
                id: 'internal-uuid4',
                data: { gender: 'M' },
                source: { name: 'latam', updatedAt: date },
              },
            },
          },
        },
      ])

      expect(mutation).toMatchObject({
        request: `mutation($input1: CreateCustomerInput, $input2: CreateCustomerInput, $input3: UpdateCustomerInput, $input4: UpdateCustomerInput) { alias1: createCustomer(input: $input1) { id } alias2: createCustomer(input: $input2) { id } alias3: updateCustomer(input: $input3) { id } alias4: updateCustomer(input: $input4) { id } }`,
        variables: {
          input1: {
            data: { firstName: 'fname', lastName: 'lname', dateOfBirth: date },
            source: { name: 'latam', id: 'external-id1', createdAt: date },
          },
          input2: {
            data: { firstName: 'fname', lastName: 'lname', gender: 'F' },
            source: { name: 'latam', id: 'external-id2', createdAt: date },
          },
          input3: {
            id: 'internal-uuid3',
            data: { dateOfBirth: date },
            source: { name: 'latam', updatedAt: date },
          },
          input4: {
            id: 'internal-uuid4',
            data: { gender: 'M' },
            source: { name: 'latam', updatedAt: date },
          },
        },
      })
    })
  })
})
