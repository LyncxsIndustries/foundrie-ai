#!/bin/bash
# scripts/audit-spec-deferrals.sh
# Extract all Out of Scope and Future Modifications from feature specs

echo "# Spec Deferral Audit Report"
echo ""
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "This report extracts all deferred items from feature specs to ensure they are implemented by Feature 64."
echo ""

total_specs=0
specs_with_deferrals=0

for file in project-kit/feature-specs/*.md; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  spec_num=$(basename "$file" .md)
  total_specs=$((total_specs + 1))
  
  # Check if file has Out of Scope or Future Modifications
  if grep -q "## Out of Scope" "$file" || grep -q "## Future Modifications" "$file"; then
    specs_with_deferrals=$((specs_with_deferrals + 1))
    
    echo "## $spec_num"
    echo ""
    
    # Extract Out of Scope
    if grep -q "## Out of Scope" "$file"; then
      echo "### Out of Scope"
      echo ""
      sed -n '/## Out of Scope/,/## Future Modifications\|## Quality Gates\|## Acceptance Criteria/p' "$file" | sed '$d' | tail -n +2
      echo ""
    fi
    
    # Extract Future Modifications
    if grep -q "## Future Modifications" "$file"; then
      echo "### Future Modifications"
      echo ""
      sed -n '/## Future Modifications/,/## Quality Gates\|## Acceptance Criteria/p' "$file" | sed '$d' | tail -n +2
      echo ""
    fi
    
    echo "---"
    echo ""
  fi
done

echo "## Summary"
echo ""
echo "- **Total specs audited**: $total_specs"
echo "- **Specs with deferrals**: $specs_with_deferrals"
echo "- **Specs without deferrals**: $((total_specs - specs_with_deferrals))"
echo ""
echo "## Next Steps"
echo ""
echo "1. Review each deferred item"
echo "2. Determine which spec should implement it"
echo "3. Update specs accordingly"
echo "4. Verify all items resolved by Feature 64"
echo ""
echo "See \`docs/SPEC-AUDIT-FRAMEWORK.md\` for the complete audit framework."
