from django.db import migrations, connection

def add_fk_metodo_pago(apps, schema_editor):
    with connection.cursor() as cur:
        # 0) Chequeo: la tabla metodo_de_pago debe existir
        cur.execute("SHOW TABLES LIKE 'metodo_de_pago';")
        if cur.fetchone() is None:
            raise Exception("Falta la tabla 'metodo_de_pago' en la BD.")

        def ensure_column(table):
            cur.execute("""
                SELECT 1
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = 'id_metodo_pago'
            """, [table])
            exists = cur.fetchone() is not None
            if not exists:
                cur.execute(f"ALTER TABLE `{table}` ADD COLUMN `id_metodo_pago` INT UNSIGNED NULL;")

        def ensure_fk(table, constraint_name):
            cur.execute("""
                SELECT 1
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = 'id_metodo_pago'
                  AND REFERENCED_TABLE_NAME = 'metodo_de_pago'
                  AND REFERENCED_COLUMN_NAME = 'id_metodo_pago'
            """, [table])
            has_fk = cur.fetchone() is not None
            if not has_fk:
                cur.execute(f"""
                    ALTER TABLE `{table}`
                    ADD CONSTRAINT `{constraint_name}`
                    FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodo_de_pago`(`id_metodo_pago`)
                    ON DELETE SET NULL ON UPDATE CASCADE;
                """)

        # Ventas
        ensure_column('ventas')
        ensure_fk('ventas', 'fk_venta_metodo_pago')

        # Compras
        ensure_column('compras')
        ensure_fk('compras', 'fk_compra_metodo_pago')

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    # Dependé de la última que ya marcaste FAKED para mantener el orden
    dependencies = [
        ('pizzeria', '0009_delete_estado_mesas_alter_mesas_options'),
    ]

    operations = [
        migrations.RunPython(add_fk_metodo_pago, noop),
    ]
