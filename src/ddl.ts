import { Dictionary } from './keywords';
import { Schema, Table, PgType, Reference, TableBySchema } from './Table';

const generateCreateSequencesSQL = (
    table: TableBySchema,
    {
        applyIfNotExist = false,
        owner
    }: { applyIfNotExist?: boolean; owner?: string } = {}
) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns) as [
        string,
        Table['columns'][string]
    ][]) {
        if (
            (column as unknown as Record<'defaultValue', ['auto-increment']>)
                .defaultValue?.[0] !== 'auto-increment'
        ) {
            continue;
        }

        const sequenceName = getSequenceName(
            table.schemaName,
            table.tableName,
            key,
            column
        );
        const tokens = ['CREATE SEQUENCE'];
        if (applyIfNotExist) {
            tokens.push('IF NOT EXISTS');
        }
        tokens.push(sequenceName);

        switch (column.type as 'int2' | 'int4') {
            case 'int2':
                tokens.push('AS SMALLINT');
                break;
            case 'int4':
                tokens.push('AS INTEGER');
                break;
        }

        queries.push(tokens.join(' '));

        if (owner !== undefined) {
            queries.push(`ALTER SEQUENCE ${sequenceName} OWNER TO ${owner}`);
        }
    }
    return queries;
};

const generateDropSequencesSQL = (
    table: TableBySchema,
    { applyIfExist = false }: { applyIfExist?: boolean } = {}
) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns) as [
        string,
        Table['columns'][string]
    ][]) {
        if (
            (column as unknown as Record<'defaultValue', ['auto-increment']>)
                .defaultValue?.[0] !== 'auto-increment'
        ) {
            continue;
        }

        queries.push(
            `DROP SEQUENCE ${applyIfExist ? 'IF EXISTS ' : ''}${getSequenceName(table.schemaName, table.tableName, key, column)}`
        );
    }
    return queries;
};

const generateCreateTableSQL = (
    table: TableBySchema,
    {
        applyIfNotExist = false,
        isTemp = false,
        owner
    }: { applyIfNotExist?: boolean; isTemp?: boolean; owner?: string } = {}
) => {
    // columns
    const columnsAsEntries = Object.entries(table.columns) as [
        string,
        Table['columns'][string]
    ][];
    const columns = columnsAsEntries.map(([key, column]) => {
        const tokens = [`"${column.title ?? key}" ${getColumnTypeSQL(column)}`];

        // default
        if (column.default) {
            const defaultValue = (
                column as unknown as {
                    defaultValue:
                        | ['auto-increment']
                        | ['created-at']
                        | ['updated-at']
                        | ['sql', string]
                        | ['js', unknown];
                }
            ).defaultValue;
            switch (defaultValue[0]) {
                case 'auto-increment':
                    tokens.push(
                        `DEFAULT NEXTVAL('${getSequenceName(table.schemaName, table.tableName, key, column)}'::REGCLASS)`
                    );
                    break;
                case 'sql':
                    tokens.push(`DEFAULT ${defaultValue[1]}`);
                    break;
            }
        }

        // nullable
        tokens.push(column.nullable ? 'NULL' : 'NOT NULL');

        // reference
        const reference = column.reference as Reference<Schema, string>;
        if (reference !== undefined) {
            tokens.push(
                `REFERENCES "${reference.table.schemaName}"."${reference.table.tableName}"` +
                    `("${
                        (
                            reference.table.columns[reference.column] as {
                                title?: string;
                            }
                        ).title ?? reference.column
                    }") ` +
                    `ON UPDATE ${
                        Dictionary.ReferenceAction[
                            reference.onUpdate ?? 'no-action'
                        ]
                    } ON DELETE ${Dictionary.ReferenceAction[reference.onDelete ?? 'no-action']}`
            );
        }

        return tokens.join(' ');
    });

    // constraints
    const constraints = [];
    const primaryKeys = columnsAsEntries.filter(
        ([, column]) => !column.nullable && column.primary
    );
    if (primaryKeys.length !== 0) {
        constraints.push(
            `CONSTRAINT "${table.tableName}_pk" PRIMARY KEY(${primaryKeys
                .map(([key, column]) => `"${column.title ?? key}"`)
                .join(', ')})`
        );
    }

    const tableName = `"${table.schemaName}"."${table.tableName}"`;
    const createSQL = `CREATE ${isTemp ? 'TEMPORARY ' : ''}TABLE ${applyIfNotExist ? 'IF NOT EXISTS ' : ''}${tableName}(${[...columns, ...constraints].join(', ')})`;

    // CREATE TABLE has no OWNER clause; ownership is set with a second statement.
    return owner !== undefined
        ? `${createSQL}; ALTER TABLE ${tableName} OWNER TO ${owner}`
        : createSQL;
};

const getColumnTypeSQL = (column: Table['columns'][string]) => {
    if (column.type.startsWith('custom(') && column.type.endsWith(')')) {
        return column.type.substring('custom('.length, column.type.length - 1);
    }
    const typeSQL =
        Dictionary.PostgresType[
            column.type as Exclude<PgType, `custom(${string})`>
        ];
    switch (column.type) {
        case 'decimal':
            return `${typeSQL}(${column.precision}, ${column.scale})`;
        case 'char':
        case 'varchar':
            return column.maxLength !== undefined
                ? `${typeSQL}(${column.maxLength})`
                : typeSQL;
        default:
            return typeSQL;
    }
};

const generateDropTableSQL = (
    table: TableBySchema,
    { applyIfExist = false }: { applyIfExist?: boolean } = {}
) =>
    `DROP TABLE ${applyIfExist ? 'IF EXISTS ' : ''}"${table.schemaName}"."${table.tableName}"`;

const getSequenceName = (
    schemaName: string,
    tableName: string,
    columnKey: string,
    column: {
        title?: string;
        sequenceTitle?: string;
    }
) =>
    `"${schemaName}"."` +
    (column.sequenceTitle ??
        tableName + '_' + (column.title ?? columnKey) + '_seq') +
    '"';

export {
    generateCreateSequencesSQL,
    generateDropSequencesSQL,
    generateCreateTableSQL,
    generateDropTableSQL,
    getSequenceName
};
