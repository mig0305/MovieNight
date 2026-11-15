import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { SearchBar } from "./SearchBar";

test("submits a movie search when the user clicks Search", async () => {
    // Arrange
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} />);

    // Act
   
    await user.type(
        screen.getByLabelText(/search for a movie/i),
        "Interstellar"
    );


    await user.click(
        screen.getByRole("button", { name: /search/i })
    );

    // Assert
    expect(onSearch).toHaveBeenCalledWith("Interstellar");
});
