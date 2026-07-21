import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function snakeCase(value: string): string {
  return value.replace(
    /[A-Z]/g,
    (letter, index) => (index > 0 ? '_' : '') + letter.toLowerCase(),
  );
}

// Alternativa local a `typeorm-naming-strategies`: a lib publicada não
// declara suporte à major atual do TypeORM (peer dep trava em ^0.2/^0.3) e
// depende de um caminho interno do pacote (`typeorm/util/StringUtils`) sem
// garantia de estabilidade entre versões. Estendendo `DefaultNamingStrategy`
// da própria versão instalada, os métodos não sobrescritos aqui (indexName,
// foreignKeyName, checkConstraintName etc.) usam a implementação padrão do
// TypeORM em vigor.
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(
    targetName: string,
    userSpecifiedName: string | undefined,
  ): string {
    return userSpecifiedName ?? snakeCase(targetName);
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const prefix = embeddedPrefixes.map(snakeCase).join('_');
    const base = customName ?? snakeCase(propertyName);
    return prefix ? `${prefix}_${base}` : base;
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return snakeCase(
      `${firstTableName}_${firstPropertyName.replace(/\./g, '_')}_${secondTableName}`,
    );
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }
}
