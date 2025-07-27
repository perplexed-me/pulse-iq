// package com.pulseiq.config;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.jdbc.core.JdbcTemplate;
// import org.springframework.stereotype.Component;

// @Component
// public class DatabaseMigration implements CommandLineRunner {

//     @Autowired
//     private JdbcTemplate jdbcTemplate;

//     @Override
//     public void run(String... args) throws Exception {
//         try {
//             // Drop the test_results table to allow custom doctor names
//             System.out.println("=== DATABASE MIGRATION: Dropping test_results table ===");
            
//             // Check if the table exists first
//             String checkTableQuery = """
//                 SELECT COUNT(*) FROM information_schema.tables 
//                 WHERE table_name = 'test_results' 
//                 AND table_schema = 'pulseiq'
//                 """;
            
//             Integer tableCount = jdbcTemplate.queryForObject(checkTableQuery, Integer.class);
            
//             if (tableCount != null && tableCount > 0) {
//                 // Drop the table (CASCADE will drop dependent constraints)
//                 String dropTableQuery = "DROP TABLE IF EXISTS pulseiq.test_results CASCADE";
//                 jdbcTemplate.execute(dropTableQuery);
//                 System.out.println("Successfully dropped test_results table and all its constraints");
//                 System.out.println("Table will be recreated by Hibernate without the problematic foreign key constraint");
//             } else {
//                 System.out.println("test_results table not found, skipping...");
//             }
            
//             System.out.println("=== DATABASE MIGRATION COMPLETED ===");
            
//         } catch (Exception e) {
//             System.err.println("Error during database migration: " + e.getMessage());
//             // Don't fail the application startup if migration fails
//             e.printStackTrace();
//         }
//     }
// }
